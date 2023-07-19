// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TasksManagerGasTest {

    address private immutable owner; 

    enum TaskState {
        Created,
        Cancelled, 
        Active,
        CompletedSuccessfully,
        CompletedUnsuccessfully,
        Invalid, 
        ResultsReceivedSuccessfully,
        ResultsReceivedUnsuccessfully
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
        uint lastUpdateTimestamp;
        TaskState taskState;
        PaymentState paymentState;
    }

    struct providerRating {
        uint upVotes;
        uint downVotes;
    }

    mapping (bytes32 => Task) private tasks;
    bytes32[] public bytes32_tasks;
    mapping(address => providerRating) private performance;

    //Events
    event TaskCreated(bytes32 taskID);
    event TaskActivated(bytes32 taskID);
    event TaskCompletedSuccessfully(bytes32 taskID);
    event TaskCompletedUnsuccessfully(bytes32 taskID);
    event TaskReceivedResultsSuccessfully(bytes32 taskID);
    event TaskReceivedResultsUnsuccessfully(bytes32 taskID);
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

    error Error__OwnerOnly();
    error Error__ClientOnly();
    error Error__ProviderOnly();
    error Error__ClientOrProviderOnly();
    error Error__TaskState();
    error Error__PaymentState();
    error Error__WrongValue();
    error Error__RegisteredTaskOnly();
    error Error__NotRegisteredTaskOnly();

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
    ) public payable 
    {
        if(isRegistered(_taskID))
        {
            revert Error__NotRegisteredTaskOnly();
        }
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
        tasks[_taskID].lastUpdateTimestamp = block.timestamp;
        bytes32_tasks.push(_taskID);
        emit TaskCreated(_taskID);
    }

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    function cancelTask(bytes32 _taskID) public  
    {
        if (msg.sender != tasks[_taskID].client)
        {
            revert Error__ClientOnly();
        }
        if (tasks[_taskID].taskState != TaskState.Created) 
        {
            revert Error__TaskState();
        }
        tasks[_taskID].taskState = TaskState.Cancelled;
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral);
        tasks[_taskID].lastUpdateTimestamp = block.timestamp;
        emit TransferMadeToClient(tasks[_taskID].client,tasks[_taskID].clientCollateral);
        emit TaskCancelled(_taskID);
        // deleteTask(_taskID);
    }

    function invalidateTask(bytes32 _taskID) public
    {
        if (msg.sender != tasks[_taskID].client)
        {
            revert Error__ClientOnly();
        }
        if (tasks[_taskID].taskState != TaskState.Active) 
        {
            revert Error__TaskState();
        }
        require(
            (block.timestamp > tasks[_taskID].activationTime + tasks[_taskID].deadline),
            "Time has not expired."
        );
        tasks[_taskID].taskState = TaskState.Invalid;
  
        tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        tasks[_taskID].lastUpdateTimestamp = block.timestamp;
        emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
        emit TaskInvalidated(_taskID);
        // deleteTask(_taskID);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    function activateTask(bytes32 _taskID) public payable
    {
        if (msg.sender != tasks[_taskID].provider)
        {
            revert Error__ProviderOnly();
        }
        if (tasks[_taskID].taskState != TaskState.Created) 
        {
            revert Error__TaskState();
        }
        if (!isRegistered(_taskID)) 
        {
            revert Error__RegisteredTaskOnly();
        }
        require (msg.value >= tasks[_taskID].providerCollateral, "Provider collateral is not enough");
        tasks[_taskID].activationTime = block.timestamp;
        tasks[_taskID].providerCollateral = msg.value;
        tasks[_taskID].taskState = TaskState.Active;
        tasks[_taskID].lastUpdateTimestamp = block.timestamp;
        emit TaskActivated(_taskID);
    }

    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    //called by docker container
    function completeTask(bytes32 _taskID,string memory ver,  uint _duration, uint _timeReceivedProvider) public
    {
        if (msg.sender != tasks[_taskID].provider)
        {
            revert Error__ProviderOnly();
        }
        if (tasks[_taskID].taskState != TaskState.Active) 
        {
            revert Error__TaskState();
        }
        tasks[_taskID].timeResultProvided = _timeReceivedProvider;
        tasks[_taskID].duration = _duration;
        if (InTime(_taskID) && CorrectVerification(_taskID, ver)){
            tasks[_taskID].cost = tasks[_taskID].price * tasks[_taskID].duration;
            tasks[_taskID].taskState = TaskState.CompletedSuccessfully;
            tasks[_taskID].lastUpdateTimestamp = block.timestamp;
            emit TaskCompletedSuccessfully(_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            performance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
            tasks[_taskID].taskState = TaskState.CompletedUnsuccessfully;
            tasks[_taskID].lastUpdateTimestamp = block.timestamp;
            emit TaskCompletedUnsuccessfully(_taskID);
        }
    }


    //called by provider
    function sendResults(bytes32 _taskID, string memory _results) public {
        if (msg.sender != tasks[_taskID].provider)
        {
            revert Error__ProviderOnly();
        }
        if (tasks[_taskID].taskState != TaskState.CompletedSuccessfully) 
        {
            revert Error__TaskState();
        }
        if (tasks[_taskID].paymentState != PaymentState.Initialized) 
        {
            revert Error__PaymentState();
        }
        tasks[_taskID].timeResultReceived = block.timestamp;
        tasks[_taskID].results = _results;
        if (ProviderTime(_taskID)){
            if (tasks[_taskID].cost <= tasks[_taskID].clientCollateral) {
                tasks[_taskID].provider.transfer(tasks[_taskID].cost + tasks[_taskID].providerCollateral);
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].cost + tasks[_taskID].providerCollateral);
                tasks[_taskID].client.transfer(tasks[_taskID].cost - tasks[_taskID].clientCollateral);
                emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].cost - tasks[_taskID].clientCollateral);
                tasks[_taskID].paymentState = PaymentState.Completed;
                tasks[_taskID].lastUpdateTimestamp = block.timestamp;
                emit PaymentCompleted(_taskID);                
            }
            else {
                tasks[_taskID].provider.transfer(tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].clientCollateral+tasks[_taskID].providerCollateral);
                tasks[_taskID].paymentState = PaymentState.Pending;
                tasks[_taskID].lastUpdateTimestamp = block.timestamp;
                emit PaymentPending(_taskID,tasks[_taskID].cost - tasks[_taskID].clientCollateral);
            }
            tasks[_taskID].taskState = TaskState.ResultsReceivedSuccessfully;
            tasks[_taskID].lastUpdateTimestamp = block.timestamp;
            emit TaskReceivedResultsSuccessfully(_taskID);
            performance[tasks[_taskID].provider].upVotes += 1;
            emit ProviderUpvoted(tasks[_taskID].provider,_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].clientCollateral + tasks[_taskID].providerCollateral);
            tasks[_taskID].taskState = TaskState.ResultsReceivedUnsuccessfully;
            tasks[_taskID].lastUpdateTimestamp = block.timestamp;
            emit TaskReceivedResultsUnsuccessfully(_taskID);
            performance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
        }
    }


    function completePayment(bytes32 _taskID) public payable {
        if (msg.sender != tasks[_taskID].client)
        {
            revert Error__ClientOnly();
        }
        if (tasks[_taskID].taskState != TaskState.ResultsReceivedSuccessfully) 
        {
            revert Error__TaskState();
        }
         if (tasks[_taskID].paymentState != PaymentState.Pending) 
        {
            revert Error__PaymentState();
        }
        if (msg.value != tasks[_taskID].cost - tasks[_taskID].clientCollateral)
        {
            revert Error__WrongValue();
        }
        require (tasks[_taskID].paymentState == PaymentState.Pending, "Payment not needed");
        tasks[_taskID].provider.transfer(msg.value);
        emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].cost - tasks[_taskID].clientCollateral);
        tasks[_taskID].paymentState = PaymentState.Completed;
        tasks[_taskID].lastUpdateTimestamp = block.timestamp;
        emit PaymentCompleted(_taskID);
    }

    //add time difference between lastUpdateTimestamp and now
    function deleteTasks() public { 
        if (msg.sender != owner)
        {
            revert Error__OwnerOnly();
        }
        for (uint i = bytes32_tasks.length; i > 0; i--)
        {
            bytes32 _taskID = bytes32_tasks[i-1];
            if ((tasks[_taskID].taskState == TaskState.ResultsReceivedSuccessfully && tasks[_taskID].paymentState == PaymentState.Completed 
            || tasks[_taskID].taskState == TaskState.ResultsReceivedUnsuccessfully 
            || tasks[_taskID].taskState == TaskState.CompletedUnsuccessfully 
            || tasks[_taskID].taskState == TaskState.Cancelled 
            || tasks[_taskID].taskState == TaskState.Invalid) 
            && block.timestamp > tasks[_taskID].lastUpdateTimestamp + 60) 
            //TO ADD time difference between lastUpdateTimestamp eg 24h instead of 1 min
            {
                delete(tasks[_taskID]);
                bytes32_tasks[i-1] = bytes32_tasks[bytes32_tasks.length - 1];
                bytes32_tasks.pop();
                emit TaskDeleted(_taskID);
            }
        }
    }

    function deleteTask(bytes32 _taskID) public  {
        if (msg.sender != owner)
        {
            revert Error__OwnerOnly();
        }
        if (!isRegistered(_taskID)) 
        {
            revert Error__RegisteredTaskOnly();
        }
        delete(tasks[_taskID]);
        for (uint i=0; i < bytes32_tasks.length; i++)
        {
            if (bytes32_tasks[i] == _taskID)
            {
                bytes32_tasks[i] = bytes32_tasks[bytes32_tasks.length - 1];
                bytes32_tasks.pop();
                break;
            }
        }
        emit TaskDeleted(_taskID);
    }

    function getActiveTasks() public view returns (uint256) {
        if (msg.sender != owner)
        {
            revert Error__OwnerOnly();
        }
        return bytes32_tasks.length;
    }
    //Functions -> Private/internal
    function InTime(bytes32 _taskID) private view returns (bool){
        return (tasks[_taskID].timeResultProvided <= tasks[_taskID].activationTime + tasks[_taskID].deadline) && (tasks[_taskID].duration <= tasks[_taskID].deadline);  
    }

    function ProviderTime(bytes32 _taskID) private view returns (bool) {
        return (tasks[_taskID].timeResultReceived <= tasks[_taskID].timeResultProvided + 600) && (tasks[_taskID].timeResultReceived >= tasks[_taskID].timeResultProvided) && (tasks[_taskID].timeResultReceived >= tasks[_taskID].activationTime + tasks[_taskID].duration) && (tasks[_taskID].timeResultProvided >= tasks[_taskID].activationTime + tasks[_taskID].duration); //gives 600 sec to provider to send the results, time received must be greater than time provided
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

    function getComputationCode(bytes32 _taskID) public view returns (string memory) {
        return tasks[_taskID].computationCode;
    }

    function getVerificationCode(bytes32 _taskID) public view returns (string memory) {
        return tasks[_taskID].verificationCode;
    }

    //Getters - some to be deleted
    function getActivationTime(bytes32 _taskID) public view returns (uint)
    {
        return tasks[_taskID].activationTime;
    }

    function getLastUpdateTimestamp(bytes32 _taskID) public view returns (uint)
    {
        return tasks[_taskID].lastUpdateTimestamp;
    }

    function getResults(bytes32 _taskID) public view returns (string memory)  {
        if (msg.sender != tasks[_taskID].client)
        {
            revert Error__ClientOnly();
        }
        if (tasks[_taskID].taskState != TaskState.ResultsReceivedSuccessfully) 
        {
            revert Error__TaskState();
        }
         if (tasks[_taskID].paymentState != PaymentState.Completed) 
        {
            revert Error__PaymentState();
        }
        return tasks[_taskID].results;
    }

    function getTaskState(bytes32 _taskID) public view returns (string memory)
    {
        if (msg.sender != tasks[_taskID].client && msg.sender != tasks[_taskID].provider && msg.sender != owner)
        {
            revert Error__ClientOrProviderOnly();
        }
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
        else if (tasks[_taskID].taskState == TaskState.ResultsReceivedSuccessfully)
            ret = "ResultsReceivedSuccessfully";
        else if (tasks[_taskID].taskState == TaskState.ResultsReceivedUnsuccessfully)
            ret = "ResultsReceivedUnsuccessfully";
        else 
            ret = "Error";
        return ret; 
    }

    function getPaymentState(bytes32 _taskID) public view returns (string memory)
    {
        if (msg.sender != tasks[_taskID].client && msg.sender != tasks[_taskID].provider && msg.sender != owner)
        {
            revert Error__ClientOrProviderOnly();
        }
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

    function getCost(bytes32 _taskID) public view returns (uint)
    {
        if (msg.sender != tasks[_taskID].client && msg.sender != tasks[_taskID].provider && msg.sender != owner)
        {
            revert Error__ClientOrProviderOnly();
        }
        return tasks[_taskID].cost;
    }

    function getPayment(bytes32 _taskID) public view returns (uint) 
    {
        if (msg.sender != tasks[_taskID].client && msg.sender != tasks[_taskID].provider && msg.sender != owner)
        {
            revert Error__ClientOrProviderOnly();
        }
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

    function getTask(bytes32 _taskID) public view returns (Task memory) {
        if (msg.sender != owner)
        {
            revert Error__OwnerOnly();
        }
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