// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TasksManager {

    address private immutable owner; 

    enum TaskState {
        Created,
        Cancelled, //to be cut
        Active,
        Completed,
        Invalid //to be cut
    }

    enum PaymentState {
        Initialized,
        Pending,
        Completed //to be cut
    }


    struct Task {
        address payable provider;
        address payable client;
        uint price;
        uint providerCollateral;
        uint clientCollateral; //maybe to be cut
        uint payment;
        uint deadline;
        uint duration;
        uint activationTime;
        uint timeResultProvided;
        uint timeResultReceived;
        TaskState taskState;
        PaymentState paymentState;
        string code;
        bytes32 clientVerification;
        string providerVerification;
    }

    struct providerRating {
        uint upVotes;
        uint downVotes;
    }

    mapping (bytes32 => Task) private tasks;
    mapping(address => providerRating) private performance;

    //Events
    event TaskCreated(bytes32 taskID);
    event TaskActivated(bytes32 taskID);
    event TaskCompleted(bytes32 taskID);
    event TaskCancelled(bytes32 taskID);
    event TaskInvalidated(bytes32 taskID);
    event PaymentPending(bytes32 taskID, uint payment);
    event PaymentCompleted(bytes32 taskID);
    event TransferMade(address Address, uint Amount);
    event ProviderUpvoted(address provider, bytes32 task);
    event ProviderDownvoted(address provider, bytes32 task);
    event TaskRegistered(bytes32 task);
    event TaskUnregistered(bytes32 task);

    //Modifiers

    modifier ownerOnly() {
        require(
            msg.sender == owner,
            "Method can be called only by owner."
        );
        _;
    }

    modifier clientOnly(bytes32 _taskID) {
        require(
            msg.sender == tasks[_taskID].client,
            "Method can be called only by client."
        );
        _;
    }

    modifier providerOnly(bytes32 _taskID) {
        require(
            msg.sender == tasks[_taskID].provider,
            "Method can be called only by provider."
        );
        _;
    }

    modifier inTaskState(bytes32 _taskID,TaskState _taskState) {
        require(
            tasks[_taskID].taskState == _taskState,
            "Invalid TaskState."
        );
        _;
    }

    modifier inPaymentState(bytes32 _taskID,PaymentState _paymentState) {
        require(
            tasks[_taskID].paymentState == _paymentState,
            "Invalid PaymentState."
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

    modifier registeredTaskOnly(bytes32 _taskID) {
        require(
            isRegistered(_taskID),
            "Task must be registered"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    //owner only or by auction contract or by client
    function createTask(
        bytes32 _taskID, 
        address payable _client,
        address payable _provider,
        uint _price,
        uint _providerCollateral,
        uint _deadline,
        bytes32 _clientVerification
    ) 
    public
    {
        tasks[_taskID].client = _client;
        tasks[_taskID].provider = _provider;
        tasks[_taskID].price = _price;
        tasks[_taskID].providerCollateral = _providerCollateral;
        tasks[_taskID].deadline = _deadline;
        tasks[_taskID].clientVerification = _clientVerification;
        tasks[_taskID].taskState = TaskState.Created;
        tasks[_taskID].paymentState = PaymentState.Initialized;
        emit TaskCreated(_taskID);
        emit TaskRegistered(_taskID);
    }

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    // - no requiresClient so that it can be tested
    function cancelTask(bytes32 _taskID) public clientOnly(_taskID) inTaskState(_taskID,TaskState.Created) requiresBalance(tasks[_taskID].clientCollateral)
    // function cancelTask(bytes32 _taskID) public inTaskState(_taskID,TaskState.Created) requiresBalance(tasks[_taskID].clientCollateral)
    // function cancelTask(bytes32 _taskID) public
    {
        tasks[_taskID].taskState = TaskState.Cancelled;
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral);
        emit TransferMade(tasks[_taskID].client,tasks[_taskID].clientCollateral);
        delete(tasks[_taskID]);
        emit TaskCancelled(_taskID);
        emit TaskUnregistered(_taskID);
    }

    // - no requiresClient so that it can be tested
    function invalidateTask(bytes32 _taskID) public  clientOnly(_taskID) inTaskState(_taskID, TaskState.Active) requiresBalance(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral)
    // function invalidateTask(bytes32 _taskID) public inTaskState(_taskID, TaskState.Active) requiresBalance(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral) 
    // function invalidateTask(bytes32 _taskID) public 
    {
        require(
            (block.timestamp > tasks[_taskID].activationTime + tasks[_taskID].deadline),
            "Time has not expired."
        );
        tasks[_taskID].taskState = TaskState.Invalid;
  
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        emit TransferMade(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        delete(tasks[_taskID]);
        emit TaskInvalidated(_taskID);
        emit TaskUnregistered(_taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    // - no requiresProvider so that it can be tested
    function activateTask(bytes32 _taskID) public payable providerOnly(_taskID) requiresValue(tasks[_taskID].providerCollateral) inTaskState(_taskID,TaskState.Created) requiresBalance(tasks[_taskID].clientCollateral +  tasks[_taskID].providerCollateral) registeredTaskOnly(_taskID)
    // function activateTask(bytes32 _taskID) public payable requiresValue(tasks[_taskID].providerCollateral) inTaskState(_taskID,TaskState.Created) requiresBalance(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral) registeredTaskOnly(_taskID)
    // function activateTask(bytes32 _taskID) public payable
    {
        tasks[_taskID].activationTime = block.timestamp;
        tasks[_taskID].taskState = TaskState.Active;
        emit TaskActivated(_taskID);
    }

    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    // - no requiresProvider so that it can be tested
    function completeTask(bytes32 _taskID) public providerOnly(_taskID) inTaskState(_taskID,TaskState.Active) requiresBalance(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral)
    // function completeTask() public inTaskState(TaskState.Active) requiresBalance(clientCollateral + providerCollateral)
    // function completeTask(bytes32 _taskID) public
    {
        // payable(msg.sender).transfer(address(this).balance);
        if (InTime(_taskID) && ProviderTime(_taskID) && CorrectVerification(_taskID)){
            tasks[_taskID].duration = tasks[_taskID].timeResultProvided - tasks[_taskID].activationTime;
            tasks[_taskID].payment = tasks[_taskID].price * tasks[_taskID].duration;
            if (tasks[_taskID].payment <= tasks[_taskID].clientCollateral) {
                tasks[_taskID].provider.transfer(tasks[_taskID].payment+tasks[_taskID].providerCollateral);
                emit TransferMade(tasks[_taskID].provider, tasks[_taskID].payment+tasks[_taskID].providerCollateral);
                tasks[_taskID].client.transfer(tasks[_taskID].payment-tasks[_taskID].clientCollateral);
                 emit TransferMade(tasks[_taskID].client, tasks[_taskID].payment-tasks[_taskID].clientCollateral);
                tasks[_taskID].paymentState = PaymentState.Completed;
                emit PaymentCompleted(_taskID);
                //send result of computation
                
            }
            else {
                tasks[_taskID].provider.transfer(tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);
                emit TransferMade(tasks[_taskID].provider, tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);    
                tasks[_taskID].paymentState = PaymentState.Pending;
                emit PaymentPending(_taskID,tasks[_taskID].payment-tasks[_taskID].clientCollateral);
            }
            performance[tasks[_taskID].provider].upVotes += 1;
            emit ProviderUpvoted(tasks[_taskID].provider,_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            emit TransferMade(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            performance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
        }
        tasks[_taskID].taskState = TaskState.Completed;
        if (tasks[_taskID].paymentState == PaymentState.Completed){
            delete(tasks[_taskID]);
        }
        emit TaskCompleted(_taskID);
        emit TaskUnregistered(_taskID);
    }
    //not tested the occasion of client collateral because it is not decided yet if
    //createTask will be called by client, owner or the auction contract

    function completePayment(bytes32 _taskID) public payable clientOnly(_taskID) inTaskState(_taskID,TaskState.Completed) inPaymentState(_taskID,PaymentState.Pending) requiresValue(tasks[_taskID].payment-tasks[_taskID].clientCollateral) {
    // function completePayment() public payable inTaskState(TaskState.Completed) requiresValue(payment - clientCollateral) {
    // function completePayment(bytes32 _taskID) public payable {
        require (tasks[_taskID].paymentState == PaymentState.Pending, "Payment not needed");
        tasks[_taskID].provider.transfer(msg.value);
        emit TransferMade(tasks[_taskID].provider, tasks[_taskID].payment-tasks[_taskID].clientCollateral);
        tasks[_taskID].paymentState = PaymentState.Completed;
        emit PaymentCompleted(_taskID);
        delete(tasks[_taskID]);
        //send or emit result of computation
    }

    function getTask(bytes32 _taskID) public view returns (Task memory) {
        return tasks[_taskID];
    }

    //Setters
    //to be inside completeTask
    function receiveResults(bytes32 _taskID, string memory ver, uint _timeReceivedProvider) public {
        tasks[_taskID].providerVerification = ver;   
        tasks[_taskID].timeResultReceived = block.timestamp;
        tasks[_taskID].timeResultProvided = _timeReceivedProvider;
    }

    //code to be in constructor in createTask
    // function setCode(bytes32 _taskID, string memory _code) public{
    //     tasks[_taskID].code = _code;
    // }

    //Functions -> Private/internal
    function InTime(bytes32 _taskID) public view returns (bool){
        return (tasks[_taskID].timeResultReceived <= tasks[_taskID].activationTime + tasks[_taskID].deadline);  //first argument may be deleted
    }

    function ProviderTime(bytes32 _taskID) public view returns (bool) {
        return (tasks[_taskID].timeResultReceived <= tasks[_taskID].timeResultProvided + 60); //gives 60 sec to provider to send the results
    }

    function CorrectVerification(bytes32 _taskID) public view returns (bool){
        return (tasks[_taskID].clientVerification == keccak256(abi.encodePacked(tasks[_taskID].providerVerification)));
    }

    function isRegistered(bytes32 _taskID) public view returns (bool) {
        return (tasks[_taskID].client != address(0));
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: upVotes, downVotes
    }

    //Getters - to be deleted
    function getActivationTime(bytes32 _taskID) public view returns (uint)
    {
        return tasks[_taskID].activationTime;
    }

    // function getCode() public view returns (string memory){
    //     return code;
    // }

    // TaskState: Created->0, Cancelled->1, Active->2, Completed->3, Invalid->4
    function getTaskState(bytes32 _taskID) public view returns (TaskState)
    {
        return tasks[_taskID].taskState;
    }

    // PaymentState: Initiliazed->0, Pending->1, Completed->2
    function getPaymentState(bytes32 _taskID) public view returns (PaymentState)
    {
        return tasks[_taskID].paymentState;
    }

    // function getPayment(bytes32 _taskID) public view returns (uint)
    // {
    //     return tasks[_taskID].payment;
    // }

    function getProviderCollateral(bytes32 _taskID) public view returns (uint)
    {
        return tasks[_taskID].providerCollateral;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}