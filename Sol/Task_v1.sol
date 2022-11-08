// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
//taskID to be bytes32 instead of address

contract Providers {

    struct providerRating {
        uint votes;
        int upVotes;
        int downVotes;
    }

    mapping(address => providerRating) public performance;

    event ProviderUpvoted(address provider);
    event ProviderDownvoted(address provider);

    function upVote(address provider) public {
        performance[provider].votes += 1;
        performance[provider].upVotes += 1;
        emit ProviderUpvoted(provider);
    }

    function downVote(address provider) public {
        performance[provider].votes += 1;
        performance[provider].downVotes += 1;
        emit ProviderDownvoted(provider);
    }

}

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

    address payable internal provider;
    address payable internal client;
    address internal taskID; //by auction contract  //can be bytes32
    
    uint internal price;   //can be float at front-end, payment per sec of execution
    uint internal providerCollateral;   //can be float at front-end
    uint internal clientCollateral;
    uint internal payment;
    uint internal deadline;
    uint internal duration;  //contract duration, in sec
    
    uint internal activationTime;   //contract activation date, in sec since epoch
    uint internal timeResultProvided;     //time of result given by provider, in sec since epoch
    uint internal timeResultReceived;    //time of received result, in sec since epoch   

    TaskState internal taskState;   //taskState of contract
    PaymentState internal paymentState;

    string code;   //string for ipfs address 

    bytes32 internal clientVerification;
    string internal providerVerification;


    //Events 
    //taskID to be deleted
    event TaskActivated(address taskID);
    event TaskCompleted(address taskID);
    event TaskCancelled(address taskID);
    event TaskInvalidated(address taskID);
    event PaymentPending(address taskID, uint payment);
    event PaymentCompleted(address taskID);
    event TransferMade(address Address, uint Amount);

    //Modifiers 
    modifier onlyClient() {
        require(
            msg.sender == client,
            "Method can be called only by client."
        );
        _;
    }

    modifier onlyProvider() {
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


    //Constructor
    constructor(
        address _taskID,
        address payable _client,
        address payable _provider,
        uint _price,
        uint _providerCollateral,
        uint _deadline,
        bytes32  _clientVerification 
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
    }

    // TaskState functions to be called by smart contract or client/provider? 

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    // - no requiresClient so that it can be tested
    // function cancelContract() public onlyClient inTaskState(TaskState.Created) requiresBalance(payment)
    function cancelContract() public inTaskState(TaskState.Created) requiresBalance(clientCollateral)
    {
        taskState = TaskState.Cancelled;
        // payable(msg.sender).transfer(address(this).balance);
        // sender is client, balance is payment, the contract is not activated so there is not collateral
        client.transfer(clientCollateral);
        emit TransferMade(client,clientCollateral);
        emit TaskCancelled(taskID);
    }

    //Invalidate
    ///TaskState -> Invalid
    //can be called only by client and only if contract is activated  // no by client but auto?
    //if time has passed and the task is not comleted by the provider
    //transfers payment and collateral to client
    
    // - no requiresClient so that it can be tested
    // function invalidateContract() public  onlyClient inTaskState(TaskState.Active) requiresBalance(payment + collateral)
    function invalidateContract() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral)
    {
        require(
            (block.timestamp >  activationTime + deadline),
            "Time has not expired"
        );
        taskState = TaskState.Invalid;
        //add transfer of payment

        // payable(msg.sender).transfer(address(this).balance);
        client.transfer(clientCollateral + providerCollateral);
        emit TransferMade(client, clientCollateral + providerCollateral);
        emit TaskInvalidated(taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    // - no requiresProvider so that it can be tested
    // function activateContract() public onlyProvider requiresValue(collateral) inTaskState(TaskState.Created) requiresBalance(payment + collateral)
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
    // function completeContract() public onlyProvider inTaskState(TaskState.Active) requiresBalance(payment + collateral)
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
            }
            else {
                provider.transfer(clientCollateral+providerCollateral);
                emit TransferMade(provider, clientCollateral+providerCollateral);
                paymentState = PaymentState.Pending;
                emit PaymentPending(taskID,payment-clientCollateral);
            }
        }
        else {
            client.transfer(clientCollateral + providerCollateral);
            emit TransferMade(client, clientCollateral + providerCollateral);
        }
        taskState = TaskState.Completed;
        emit TaskCompleted(taskID);
    }

    // function completePayment() public onlyClient inTaskState(TaskState.Completed) requiresValue(payment-clientCollateral)
    function completePayment() public payable inTaskState(TaskState.Completed) requiresValue(payment - clientCollateral) {
        require (paymentState == PaymentState.Pending, "Payment not needed");
        provider.transfer(msg.value);
        emit TransferMade(provider, payment-clientCollateral); 
        paymentState = PaymentState.Completed;
        emit PaymentCompleted(taskID);
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

    function setCode(string memory _code) public{
        code = _code;
    }

    //Getters
    function getTaskID() public view returns (address)
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

    function getDuration() public view returns (uint)
    {
        return duration;
    }

    function getDeadline() public view returns (uint)
    {
        return deadline;
    }

    function getactivationTime() public view returns (uint)
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

    // TaskState: Created->0, Cancelled->1, Active->2, Complete->3, Invalid->4
    function getTaskState() public view returns (TaskState)
    {
        return taskState;
    }

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

    //Functions
    function InTime() public view returns (bool){
        return (timeResultReceived <= activationTime + deadline);  //first argument may be deleted
    }

    function ProviderTime() public view returns (bool) {
        return (timeResultReceived <= timeResultProvided + 60); //gives 60 sec to provider to send the results
    }

    function CorrectVerification() public view returns (bool){
        return (clientVerification == keccak256(abi.encodePacked(providerVerification)));
    }

    function getSC_Address() public view returns (address)  //returns address of smart contract
    {
        return address(this);
    }

}
