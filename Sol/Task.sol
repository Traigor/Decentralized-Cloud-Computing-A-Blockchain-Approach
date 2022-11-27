// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./ProvidersPerformance.sol";
import "./TasksRegistry.sol";

contract Task {

    enum TaskState {
        Created,
        Cancelled,
        Active,
        Completed,
        Invalid
    }

    enum PaymentState {
        Initialized,
        Pending,
        Completed
    }

    address payable private immutable provider;
    address payable private immutable client;
    bytes32 private immutable taskID; //by auction contract  

    TasksRegistry private tasksRegistry; //to be deleted later
    // TasksRegistry private immutable tasksRegistry = <address>
    
    uint private immutable price;   //can be float at front-end, payment per sec of execution
    uint private providerCollateral;   //can be float at front-end
    uint private clientCollateral;
    uint private payment;
    uint private deadline;
    uint private duration;  //contract duration, in sec
    
    uint private activationTime;   //contract activation date, in sec since epoch
    uint private timeResultProvided;     //time of result given by provider, in sec since epoch
    uint private timeResultReceived;    //time of received result, in sec since epoch   

    TaskState private taskState;   //taskState of contract
    PaymentState private paymentState;

    string code;   //string for ipfs address 

    bytes32 private immutable clientVerification;
    string private providerVerification;


    //Events 
    //taskID to be deleted
    event TaskActivated(bytes32 taskID);
    event TaskCompleted(bytes32 taskID);
    event TaskCancelled(bytes32 taskID);
    event TaskInvalidated(bytes32 taskID);
    event PaymentPending(bytes32 taskID, uint payment);
    event PaymentCompleted(bytes32 taskID);
    event TransferMade(address Address, uint Amount);

    //Modifiers 
    modifier clientOnly() {
        require(
            msg.sender == client,
            "Method can be called only by client."
        );
        _;
    }

    modifier providerOnly() {
        require(
            msg.sender == provider,
            "Method can be called only by provider."
        );
        _;
    }

    modifier inTaskState(TaskState _taskState) {
        require(
            taskState == _taskState,
            "Invalid TaskState."
        );
        _;
    }

    modifier requiresBalance(uint amount) {
        require(
            address(this).balance >= amount,
            "Not enough balance"
        );
        _;
    }

    modifier requiresValue(uint amount) {
        require(
            msg.value == amount,
            "Value sent is not the expected"
        );
        _;
    }


    //Constructor ,TasksRegistry will be deleted
    constructor(
        bytes32 _taskID,
        address payable _client,
        address payable _provider,
        uint _price,
        uint _providerCollateral,
        uint _deadline,
        bytes32  _clientVerification,
        TasksRegistry _tasksRegistry 
    )
    payable
    {
        taskID = _taskID;
        client = _client;
        provider = _provider;
        price = _price;
        clientCollateral = msg.value;
        providerCollateral = _providerCollateral;
        deadline = _deadline; 
        clientVerification = _clientVerification;
        taskState = TaskState.Created;
        paymentState = PaymentState.Initialized; 
        tasksRegistry = _tasksRegistry;
        tasksRegistry.registerTask(_client,_provider,_taskID);
    }

    // TaskState functions to be called by smart contract or client/provider? 

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    // - no requiresClient so that it can be tested
    // function cancelContract() public clientOnly inTaskState(TaskState.Created) requiresBalance(payment)
    function cancelContract() public inTaskState(TaskState.Created) requiresBalance(clientCollateral)
    {
        taskState = TaskState.Cancelled;
 
        client.transfer(clientCollateral);
        emit TransferMade(client,clientCollateral);
        tasksRegistry.unregisterTask(client,provider,taskID);
        emit TaskCancelled(taskID);
    }

    //Invalidate
    ///TaskState -> Invalid
    //can be called only by client and only if contract is activated  // no by client but auto?
    //if time has passed and the task is not comleted by the provider
    //transfers payment and collateral to client
    
    // - no requiresClient so that it can be tested
    // function invalidateContract() public  clientOnly inTaskState(TaskState.Active) requiresBalance(payment + collateral)
    function invalidateContract() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral)
    {
        require(
            (block.timestamp >  activationTime + deadline),
            "Time has not expired"
        );
        taskState = TaskState.Invalid;
  
        client.transfer(clientCollateral + providerCollateral);
        emit TransferMade(client, clientCollateral + providerCollateral);
        tasksRegistry.unregisterTask(client,provider,taskID);
        emit TaskInvalidated(taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    // - no requiresProvider so that it can be tested
    // function activateContract(ProvidersPerformance _providers) public payable providerOnly requiresValue(providerCollateral) inTaskState(TaskState.Created) requiresBalance(clientCollateral + providerCollateral)
    function activateContract() public payable requiresValue(providerCollateral) inTaskState(TaskState.Created) requiresBalance(clientCollateral + providerCollateral)
    {
        activationTime = block.timestamp;
        taskState = TaskState.Active;
        emit TaskActivated(taskID);
    }


    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    // - no requiresProvider so that it can be tested
    // function completeContract() public providerOnly inTaskState(TaskState.Active) requiresBalance(payment + collateral)
    function completeContract() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral)
    {
        // payable(msg.sender).transfer(address(this).balance);
        if (InTime() && ProviderTime() && CorrectVerification()){
            duration = timeResultProvided - activationTime;
            payment = price * duration;
            if (payment <= clientCollateral) {
                provider.transfer(payment+providerCollateral);
                emit TransferMade(provider, payment+providerCollateral);
                client.transfer(payment-clientCollateral);
                emit TransferMade(client, payment-clientCollateral);
                paymentState = PaymentState.Completed;
                emit PaymentCompleted(taskID);
                //send result of computation
                
            }
            else {
                provider.transfer(clientCollateral+providerCollateral);
                emit TransferMade(provider, clientCollateral+providerCollateral);
                paymentState = PaymentState.Pending;
                emit PaymentPending(taskID,payment-clientCollateral);
            }
            tasksRegistry.upVoteProvider(client,provider,taskID);
        }
        else {
            client.transfer(clientCollateral + providerCollateral);
            emit TransferMade(client, clientCollateral + providerCollateral);
            tasksRegistry.downVoteProvider(client,provider,taskID);
        }
        taskState = TaskState.Completed;
        tasksRegistry.unregisterTask(client,provider,taskID);
        emit TaskCompleted(taskID);
    }

    // function completePayment() public clientOnly inTaskState(TaskState.Completed) requiresValue(payment-clientCollateral)
    function completePayment() public payable inTaskState(TaskState.Completed) requiresValue(payment - clientCollateral) {
        require (paymentState == PaymentState.Pending, "Payment not needed");
        provider.transfer(msg.value);
        emit TransferMade(provider, payment-clientCollateral); 
        paymentState = PaymentState.Completed;
        emit PaymentCompleted(taskID);
        //send result of computation
    }
    
    //Setters
    function setProviderVerification (string memory ver) public {
        providerVerification = ver;
    }

    // times can be compared too
    function setTimeResultReceived (uint _timeReceivedProvider) public{
        timeResultReceived = block.timestamp;
        timeResultProvided = _timeReceivedProvider;
    }

    //code to be in constructor
    function setCode(string memory _code) public{
        code = _code;
    }

    //Getters - to be deleted
    function getTaskID() public view returns (bytes32)
    {
        return taskID;
    }

    function getClientAddress() public view returns (address)
    {
        return client;
    }

    function getProviderAddress() public view returns (address)
    {
        return provider;
    }

    function getPrice() public view returns (uint)
    {
        return price;
    }

    function getClientCollateral() public view returns (uint)
    {
        return clientCollateral;
    }

    function getProviderCollateral() public view returns (uint)
    {
        return providerCollateral;
    }

    function getDeadline() public view returns (uint)
    {
        return deadline;
    }

    function getActivationTime() public view returns (uint)
    {
        return activationTime;
    }

    function getTimeResultReceived() public view returns (uint){
        return timeResultReceived;
    }

     function getTimeResultProvided() public view returns (uint){
        return timeResultProvided;
    }

    function getCode() public view returns (string memory){
        return code;
    }

    // TaskState: Created->0, Cancelled->1, Active->2, Completed->3, Invalid->4
    function getTaskState() public view returns (TaskState)
    {
        return taskState;
    }

    // PaymentState: Initiliazed->0, Pending->1, Completed->2
    function getPaymentState() public view returns (PaymentState)
    {
        return paymentState;
    }

    function getPayment() public view returns (uint)
    {
        return payment;
    }
   
   function getClientVerification() public view returns (bytes32){
        return clientVerification;
    }

    function getProviderVerification() public view returns (string memory){
        return providerVerification;
    }

    //Functions -> Private/internal
    function InTime() public view returns (bool){
        return (timeResultReceived <= activationTime + deadline);  //first argument may be deleted
    }

    function ProviderTime() public view returns (bool) {
        return (timeResultReceived <= timeResultProvided + 60); //gives 60 sec to provider to send the results
    }

    function CorrectVerification() public view returns (bool){
        return (clientVerification == keccak256(abi.encodePacked(providerVerification)));
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }

}
