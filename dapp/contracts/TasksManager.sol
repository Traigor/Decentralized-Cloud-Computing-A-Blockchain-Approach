// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TasksManager {

    address private immutable owner; 

    enum TaskState {
        Created,
        Cancelled, 
        Active,
        CompletedSuccessfully,
        CompletedUnsuccessfully,
        Invalid, 
        ResultsReceived
    }

    enum PaymentState {
        Initialized,
        Pending,
        Completed 
    }

    struct Task {
        address payable client; 
        address payable provider;
        uint providerCollateral;
        uint clientCollateral; 
        uint deadline;
        uint price;
        uint duration;
        uint cost;       
        uint activationTime;
        uint timeResultProvided;
        uint timeResultReceived;
        string computationCode;
        string verificationCode;
        string results;
        bytes32 clientVerification;
        TaskState taskState;
        PaymentState paymentState;
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
    event TaskCompletedSuccessfully(bytes32 taskID);
    event TaskCompletedUnsuccessfully(bytes32 taskID);
    event TaskReceivedResults(bytes32 taskID);
    event TaskCancelled(bytes32 taskID);
    event TaskInvalidated(bytes32 taskID);
    event PaymentPending(bytes32 taskID, uint payment);
    event PaymentCompleted(bytes32 taskID);
    event TransferMadeToClient(address client, uint amount);
    event TransferMadeToProvider(address provider, uint amount);
    event ProviderUpvoted(address provider, bytes32 taskID);
    event ProviderDownvoted(address provider, bytes32 taskID);
    event TaskDeleted(bytes32 taskID);

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

    modifier clientOrProviderOnly(bytes32 _taskID) {
        require(
            (msg.sender == tasks[_taskID].client) || (msg.sender == tasks[_taskID].provider) || (msg.sender == owner),
            "Method can be called only by client, provider or the owner."
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

    modifier notRegisteredTaskOnly(bytes32 _taskID) {
        require(
            !isRegistered(_taskID),
            "Task already exists"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    //called by client, client = msg.sender
    function createTask(
        bytes32 _taskID, 
        address payable _provider,
        uint _price,
        uint _deadline,
        bytes32 _clientVerification,
        string memory _verificationCode,
        string memory _computationCode
    ) public payable notRegisteredTaskOnly(_taskID)
    {
        require (msg.value >= _price * 2, "Client collateral is not enough");
        tasks[_taskID].client = payable (msg.sender);
        tasks[_taskID].clientCollateral = msg.value;
        tasks[_taskID].provider = _provider;
        tasks[_taskID].providerCollateral = _price * 10;
        tasks[_taskID].price = _price;
        tasks[_taskID].deadline = _deadline;
        tasks[_taskID].clientVerification = _clientVerification;
        tasks[_taskID].verificationCode = _verificationCode;
        tasks[_taskID].computationCode = _computationCode;
        tasks[_taskID].taskState = TaskState.Created;
        tasks[_taskID].paymentState = PaymentState.Initialized;
        emit TaskCreated(_taskID);
    }

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    function cancelTask(bytes32 _taskID) public clientOnly(_taskID) inTaskState(_taskID,TaskState.Created) 
    {
        tasks[_taskID].taskState = TaskState.Cancelled;
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral);
        emit TransferMadeToClient(tasks[_taskID].client,tasks[_taskID].clientCollateral);
        emit TaskCancelled(_taskID);
        // deleteTask(_taskID);
    }

    function invalidateTask(bytes32 _taskID) public  clientOnly(_taskID) inTaskState(_taskID, TaskState.Active) 
    {
        require(
            (block.timestamp > tasks[_taskID].activationTime + tasks[_taskID].deadline),
            "Time has not expired."
        );
        tasks[_taskID].taskState = TaskState.Invalid;
  
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        emit TaskInvalidated(_taskID);
        // deleteTask(_taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    function activateTask(bytes32 _taskID) public payable providerOnly(_taskID) inTaskState(_taskID,TaskState.Created) registeredTaskOnly(_taskID)
    {
        require (msg.value >= tasks[_taskID].providerCollateral, "Provider collateral is not enough");
        tasks[_taskID].activationTime = block.timestamp;
        tasks[_taskID].providerCollateral = msg.value;
        tasks[_taskID].taskState = TaskState.Active;
        emit TaskActivated(_taskID);
    }

    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    //called by docker container
    function completeTask(bytes32 _taskID,string memory ver,  uint _duration, uint _timeReceivedProvider) public providerOnly(_taskID) inTaskState(_taskID,TaskState.Active) 
    {
        tasks[_taskID].timeResultProvided = _timeReceivedProvider;
        tasks[_taskID].duration = _duration;
        if (InTime(_taskID) && CorrectVerification(_taskID, ver)){
            tasks[_taskID].cost = tasks[_taskID].price * tasks[_taskID].duration;
            tasks[_taskID].taskState = TaskState.CompletedSuccessfully;
            emit TaskCompletedSuccessfully(_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            performance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
            tasks[_taskID].taskState = TaskState.CompletedUnsuccessfully;
            emit TaskCompletedUnsuccessfully(_taskID);
            // deleteTask(_taskID);
        }
    }


    //called by provider
    function receiveResults(bytes32 _taskID, string memory _results) public providerOnly(_taskID) inTaskState(_taskID,TaskState.CompletedSuccessfully) inPaymentState(_taskID,PaymentState.Initialized){
        tasks[_taskID].timeResultReceived = block.timestamp;
        tasks[_taskID].results = _results;
        if (ProviderTime(_taskID)){
            if (tasks[_taskID].cost <= tasks[_taskID].clientCollateral) {
                tasks[_taskID].provider.transfer(tasks[_taskID].cost + tasks[_taskID].providerCollateral);
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].cost + tasks[_taskID].providerCollateral);
                tasks[_taskID].client.transfer(tasks[_taskID].cost - tasks[_taskID].clientCollateral);
                emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].cost - tasks[_taskID].clientCollateral);
                tasks[_taskID].paymentState = PaymentState.Completed;
                emit PaymentCompleted(_taskID);                
            }
            else {
                tasks[_taskID].provider.transfer(tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);
                tasks[_taskID].paymentState = PaymentState.Pending;
                emit PaymentPending(_taskID,tasks[_taskID].cost - tasks[_taskID].clientCollateral);
            }
            performance[tasks[_taskID].provider].upVotes += 1;
            emit ProviderUpvoted(tasks[_taskID].provider,_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            performance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
        }
        tasks[_taskID].taskState = TaskState.ResultsReceived;
        emit TaskReceivedResults(_taskID);
    }


    function completePayment(bytes32 _taskID) public payable clientOnly(_taskID) inTaskState(_taskID,TaskState.ResultsReceived) inPaymentState(_taskID,PaymentState.Pending) requiresValue(tasks[_taskID].cost - tasks[_taskID].clientCollateral) {
        require (tasks[_taskID].paymentState == PaymentState.Pending, "Payment not needed");
        tasks[_taskID].provider.transfer(msg.value);
        emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].cost - tasks[_taskID].clientCollateral);
        tasks[_taskID].paymentState = PaymentState.Completed;
        emit PaymentCompleted(_taskID);
    }

    //for now for specific taskID,
    //it could be for all tasks that can be deleted 
    //only by owner
    function deleteTask(bytes32 _taskID) public ownerOnly registeredTaskOnly(_taskID) { 
        delete(tasks[_taskID]);
        emit TaskDeleted(_taskID);
    }

    //Functions -> Private/internal
    function InTime(bytes32 _taskID) private view returns (bool){
        return (tasks[_taskID].timeResultProvided <= tasks[_taskID].activationTime + tasks[_taskID].deadline) && (tasks[_taskID].duration <= tasks[_taskID].deadline);  
    }

    //TODO add time to send the results
    function ProviderTime(bytes32 _taskID) private view returns (bool) {
        return (tasks[_taskID].timeResultReceived <= tasks[_taskID].timeResultProvided + 60) && (tasks[_taskID].timeResultReceived >= tasks[_taskID].timeResultProvided) && (tasks[_taskID].timeResultReceived >= tasks[_taskID].activationTime) && (tasks[_taskID].timeResultProvided >= tasks[_taskID].activationTime); //gives 60 sec to provider to send the results, time received must be greater than time provided
    }

    function CorrectVerification(bytes32 _taskID, string memory ver) private view returns (bool){
        return (tasks[_taskID].clientVerification == keccak256(abi.encodePacked(ver)));
    }

    function isRegistered(bytes32 _taskID) public view returns (bool) {
        return (tasks[_taskID].client != address(0));
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: upVotes, downVotes
    }

    //Getters - some to be deleted
    function getActivationTime(bytes32 _taskID) public view returns (uint)
    {
        return tasks[_taskID].activationTime;
    }

    function getResults(bytes32 _taskID) public clientOnly(_taskID) inTaskState(_taskID,TaskState.ResultsReceived) inPaymentState(_taskID,PaymentState.Completed) view returns (string memory)  {
        return tasks[_taskID].results;
    }

    function getTaskState(bytes32 _taskID) public clientOrProviderOnly(_taskID) view returns (string memory)
    {
        string memory ret = "";
        if (tasks[_taskID].taskState == TaskState.Created) 
            ret = "Created";
        else if (tasks[_taskID].taskState == TaskState.Cancelled)
            ret = "Cancelled";
        else if (tasks[_taskID].taskState == TaskState.Active)
            ret = "Active";
        else if (tasks[_taskID].taskState == TaskState.CompletedSuccessfully)
            ret = "CompletedSuccessfully";
        else if (tasks[_taskID].taskState == TaskState.CompletedUnsuccessfully)
            ret = "CompletedUnsuccessfully";  
        else if (tasks[_taskID].taskState == TaskState.Invalid)
            ret = "Invalid";  
        else if (tasks[_taskID].taskState == TaskState.ResultsReceived)
            ret = "ResultsReceived";
        else 
            ret = "Error";
        return ret; 
    }

    function getPaymentState(bytes32 _taskID) public clientOrProviderOnly(_taskID) view returns (string memory)
    {
        string memory ret = "";
        if (tasks[_taskID].paymentState == PaymentState.Initialized) 
            ret = "Initialized";
        else if (tasks[_taskID].paymentState == PaymentState.Pending) 
            ret = "Pending";
        else if (tasks[_taskID].paymentState == PaymentState.Completed) 
            ret = "Completed";
        else 
            ret = "Error";  
        return ret; 
    }

    function getCost(bytes32 _taskID) public clientOrProviderOnly(_taskID) view returns (uint)
    {
        return tasks[_taskID].cost;
    }

    function getPayment(bytes32 _taskID) public clientOrProviderOnly(_taskID) view returns (uint) 
    {
        if (tasks[_taskID].cost > tasks[_taskID].clientCollateral) {
            return (tasks[_taskID].cost - tasks[_taskID].clientCollateral);
        }
        else {
            return 0;
        }
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getTask(bytes32 _taskID) public ownerOnly view returns (Task memory) {
        return tasks[_taskID];
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}