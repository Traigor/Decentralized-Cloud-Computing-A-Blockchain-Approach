// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Registry.sol";

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

    Registry private registry; //to be deleted later
    // Registry private immutable registry = <address>
    
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
    event TaskCreated(address task);
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

    modifier registeredTaskOnly() {
        require(
            registry.isRegistered(),
            "Task must be registered"
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
        Registry _registry 
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
        registry = _registry;
        emit TaskCreated(address(this));
    }

    // TaskState functions to be called by smart contract or client/provider? 

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    // - no requiresClient so that it can be tested
    // function cancelTask() public clientOnly inTaskState(TaskState.Created) requiresBalance(payment)
    function cancelTask() public inTaskState(TaskState.Created) requiresBalance(clientCollateral)
    {
        taskState = TaskState.Cancelled;
 
        client.transfer(clientCollateral);
        emit TransferMade(client,clientCollateral);
        registry.unregisterTask();
        emit TaskCancelled(taskID);
    }

    //Invalidate
    ///TaskState -> Invalid
    //can be called only by client and only if contract is activated  
    //if time has passed and the task is not comleted by the provider
    //transfers payment and collateral to client
    
    // - no requiresClient so that it can be tested
    // function invalidateTask() public  clientOnly inTaskState(TaskState.Active) requiresBalance(payment + collateral)
    function invalidateTask() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral) 
    {
        require(
            (block.timestamp >  activationTime + deadline),
            "Time has not expired"
        );
        taskState = TaskState.Invalid;
  
        client.transfer(clientCollateral + providerCollateral);
        emit TransferMade(client, clientCollateral + providerCollateral);
        registry.unregisterTask();
        emit TaskInvalidated(taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    // - no requiresProvider so that it can be tested
    // function activateTask() public payable providerOnly requiresValue(providerCollateral) inTaskState(TaskState.Created) requiresBalance(clientCollateral + providerCollateral) registeredTaskOnly
    function activateTask() public payable requiresValue(providerCollateral) inTaskState(TaskState.Created) requiresBalance(clientCollateral + providerCollateral) registeredTaskOnly
    {
        activationTime = block.timestamp;
        taskState = TaskState.Active;
        emit TaskActivated(taskID);
    }


    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    // - no requiresProvider so that it can be tested
    // function completeTask() public providerOnly inTaskState(TaskState.Active) requiresBalance(payment + collateral)
    function completeTask() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral)
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
            registry.upVote(provider);
        }
        else {
            client.transfer(clientCollateral + providerCollateral);
            emit TransferMade(client, clientCollateral + providerCollateral);
            registry.downVote(provider);
        }
        taskState = TaskState.Completed;
        registry.unregisterTask();
        emit TaskCompleted(taskID);
    }

    // function completePayment() public clientOnly inTaskState(TaskState.Completed) requiresValue(payment-clientCollateral)
    function completePayment() public payable inTaskState(TaskState.Completed) requiresValue(payment - clientCollateral) {
        require (paymentState == PaymentState.Pending, "Payment not needed");
        provider.transfer(msg.value);
        emit TransferMade(provider, payment-clientCollateral); 
        paymentState = PaymentState.Completed;
        emit PaymentCompleted(taskID);
        //send or emit result of computation
    }
    
    //Setters
    function receiveResults(string memory ver, uint _timeReceivedProvider) public {
        providerVerification = ver;   
        timeResultReceived = block.timestamp;
        timeResultProvided = _timeReceivedProvider;
    }

    //code to be in constructor
    function setCode(string memory _code) public{
        code = _code;
    }

    //Getters - to be deleted
    function getActivationTime() public view returns (uint)
    {
        return activationTime;
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