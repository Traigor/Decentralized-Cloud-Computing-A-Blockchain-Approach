// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TasksManager {

    address private immutable owner; 
    address private auctionAddress;
    uint private bank = 0;

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
        bytes32 taskID;
        address payable client; 
        address payable provider;
        uint deadline;
        uint price;
        uint duration;
        uint activationTime;
        uint completionTime;
        string code;
        string results;
        bytes32 clientVerification;
        TaskState taskState;
        PaymentState paymentState;
    }

    struct providerRating {
        uint upVotes;
        uint downVotes;
    }

    struct clientRating {
        uint upVotes;
        uint downVotes;
    }

    mapping (bytes32 => Task) private tasks;
    bytes32[] private bytes32_tasks;
    mapping(address => providerRating) private providerPerformance;
    mapping(address => clientRating) private clientPerformance;

    //Events
    event TaskCreated(bytes32 taskID, address client, address provider);
    event TaskActivated(bytes32 taskID, address client, address provider);
    event TaskCompletedSuccessfully(bytes32 taskID, address client, address provider);
    event TaskCompletedUnsuccessfully(bytes32 taskID, address client, address provider);
    event TaskReceivedResultsSuccessfully(bytes32 taskID, address client, address provider);
    event TaskReceivedResultsUnsuccessfully(bytes32 taskID, address client, address provider);
    event TaskCancelled(bytes32 taskID, address client, address provider);
    event TaskInvalidated(bytes32 taskID, address client, address provider);
    event PaymentPending(bytes32 taskID, address client, address provider, uint payment);
    event PaymentCompleted(bytes32 taskID, address client, address provider);
    event TransferMadeToClient(address client, uint amount);
    event TransferMadeToProvider(address provider, uint amount);
    event ProviderUpvoted(address provider, bytes32 taskID);
    event ProviderDownvoted(address provider, bytes32 taskID);
    event ClientUpvoted(address client, bytes32 taskID);
    event ClientDownvoted(address client, bytes32 taskID);

    //Errors
    error NotCalledByOwner();
    error NotCalledByAuction();
    error NotCalledByClient();
    error NotCalledByProvider();
    error NotCorrectValue(uint correctValue, uint receivedValue);
    error TaskNotInState(TaskState taskState);
    error PaymentNotInState(PaymentState paymentState);
    error TaskDoesNotExist();
    error TaskAlreadyExists();
    error AuctionsManagerNotSet();

    constructor() {
        owner = msg.sender;
    }

    function setAuctionsManager(address _auctionAddress) public  {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        auctionAddress = _auctionAddress;
    }

    function createTask(
        bytes32 _taskID,
        address _client,
        address _provider,
        uint _price,
        uint _deadline,
        bytes32 _clientVerification,
        string memory _code
    ) public payable 
    {
        //auctions manager set
        if (auctionAddress == address(0)) 
            revert AuctionsManagerNotSet();
        //auction only
        if (msg.sender != auctionAddress) 
            revert NotCalledByAuction();
        //not registered task
        if (tasks[_taskID].taskID != bytes32(0)) 
            revert TaskAlreadyExists();
        //correct client collateral
        if (msg.value != _price * 2)
            revert NotCorrectValue(_price * 2, msg.value);
        tasks[_taskID].taskID = _taskID;
        tasks[_taskID].client = payable (_client);
        tasks[_taskID].provider = payable(_provider);
        tasks[_taskID].price = _price;
        tasks[_taskID].deadline = _deadline;
        tasks[_taskID].clientVerification = _clientVerification;
        tasks[_taskID].code = _code;
        tasks[_taskID].taskState = TaskState.Created;
        tasks[_taskID].paymentState = PaymentState.Initialized;
        bytes32_tasks.push(_taskID);
        emit TaskCreated(_taskID, _client, _provider);
        //clientCollateral = 2 * price
        //providerCollateral = 10 * price
    }

    //Cancel
    //TaskState -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    function cancelTask(bytes32 _taskID) public 
    {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //client only
        if (msg.sender != tasks[_taskID].client) 
            revert NotCalledByClient();
        //in task state Created
        if (tasks[_taskID].taskState != TaskState.Created) 
            revert TaskNotInState(TaskState.Created);
        tasks[_taskID].taskState = TaskState.Cancelled;
        tasks[_taskID].client.transfer(tasks[_taskID].price * 2);
        emit TransferMadeToClient(tasks[_taskID].client,tasks[_taskID].price * 2);
        emit TaskCancelled(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
    }

    function invalidateTask(bytes32 _taskID) public 
    {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
         //client only
        if (msg.sender != tasks[_taskID].client) 
            revert NotCalledByClient();
        //in task state Active
        if (tasks[_taskID].taskState != TaskState.Active) 
            revert TaskNotInState(TaskState.Active);
        require(
            (block.timestamp > tasks[_taskID].activationTime + tasks[_taskID].deadline + 86400), //give one day to be invalidated
            "Time has not expired."
        );
        tasks[_taskID].taskState = TaskState.Invalid;
  
        tasks[_taskID].client.transfer(tasks[_taskID].price * 12 ); //clientCollateral + providerCollateral
        emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].price * 12);
        emit TaskInvalidated(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
    }

    // Activate
    // TaskState -> Activated
    // can be called only by provider to start the process

    function activateTask(bytes32 _taskID) public payable
    {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider();
        //in taskState Created
        if (tasks[_taskID].taskState != TaskState.Created) 
            revert TaskNotInState(TaskState.Created);
        //correct provider collateral
        if (msg.value != tasks[_taskID].price * 10)
            revert NotCorrectValue(tasks[_taskID].price * 10, msg.value);
        tasks[_taskID].activationTime = block.timestamp;
        tasks[_taskID].taskState = TaskState.Active;
        emit TaskActivated(_taskID, tasks[_taskID].client ,tasks[_taskID].provider);
    }

    // Complete
    // TaskState -> Completed
    // can be called only by provider when the computation is over

    //called by docker container
    function completeTask(bytes32 _taskID,string memory ver,  uint _duration, uint _timeReceivedProvider) public
    {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider();
        //in task state Active
        if (tasks[_taskID].taskState != TaskState.Active) 
            revert TaskNotInState(TaskState.Active);
        tasks[_taskID].completionTime = _timeReceivedProvider;
        tasks[_taskID].duration = _duration + 1;
        //in time and correct verification
        if ((tasks[_taskID].completionTime <= tasks[_taskID].activationTime + tasks[_taskID].deadline) 
            && (tasks[_taskID].duration <= tasks[_taskID].deadline) 
            && (tasks[_taskID].clientVerification == keccak256(abi.encodePacked(ver))))
        {
            tasks[_taskID].taskState = TaskState.CompletedSuccessfully;
            emit TaskCompletedSuccessfully(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].price * 2);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].price * 2);
            bank += tasks[_taskID].price * 10; //providerCollateral to bank
            providerPerformance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
            tasks[_taskID].taskState = TaskState.CompletedUnsuccessfully;
            emit TaskCompletedUnsuccessfully(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
        }
    }


    //called by provider
    function sendResults(bytes32 _taskID, string memory _results) public {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider();
        //in task state CompletedSuccessfully
        if (tasks[_taskID].taskState != TaskState.CompletedSuccessfully) 
            revert TaskNotInState(TaskState.CompletedSuccessfully);
        //in payment state Initialized
        if (tasks[_taskID].paymentState != PaymentState.Initialized) 
            revert PaymentNotInState(PaymentState.Initialized);
        uint receiptTime = block.timestamp;
        tasks[_taskID].results = _results;
        //gives 1 day to provider to send the results, time received must be greater than completion time
        if ((receiptTime >= tasks[_taskID].completionTime)
        && (receiptTime <= tasks[_taskID].completionTime + 86400) 
        && (receiptTime >= tasks[_taskID].activationTime + tasks[_taskID].duration) 
        && (tasks[_taskID].completionTime >= tasks[_taskID].activationTime + tasks[_taskID].duration)) 
        {
            if (tasks[_taskID].price * tasks[_taskID].duration <= tasks[_taskID].price * 2) {
                tasks[_taskID].provider.transfer(tasks[_taskID].price * tasks[_taskID].duration + tasks[_taskID].price * 10);
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].price * tasks[_taskID].duration + tasks[_taskID].price * 10);
                tasks[_taskID].client.transfer(tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2);
                emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2);
                tasks[_taskID].paymentState = PaymentState.Completed;
                emit PaymentCompleted(_taskID, tasks[_taskID].client, tasks[_taskID].provider);                
            }
            else {
                tasks[_taskID].provider.transfer(tasks[_taskID].price * 12); //clientCollateral + providerCollateral
                emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].price * 12);
                tasks[_taskID].paymentState = PaymentState.Pending;
                emit PaymentPending(_taskID, tasks[_taskID].client, tasks[_taskID].provider, tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2);
            }
            tasks[_taskID].taskState = TaskState.ResultsReceivedSuccessfully;
            emit TaskReceivedResultsSuccessfully(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
            providerPerformance[tasks[_taskID].provider].upVotes += 1;
            emit ProviderUpvoted(tasks[_taskID].provider,_taskID);
        }
        else {
            tasks[_taskID].client.transfer(tasks[_taskID].price * 2);
            emit TransferMadeToClient(tasks[_taskID].client, tasks[_taskID].price * 2);
            bank += tasks[_taskID].price * 10; //providerCollateral to bank
            tasks[_taskID].taskState = TaskState.ResultsReceivedUnsuccessfully;
            emit TaskReceivedResultsUnsuccessfully(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
            providerPerformance[tasks[_taskID].provider].downVotes += 1;
            emit ProviderDownvoted(tasks[_taskID].provider,_taskID);
        }
    }


    function completePayment(bytes32 _taskID) public payable {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //client only
        if (msg.sender != tasks[_taskID].client) 
            revert NotCalledByClient();
        //correct payment value
        if (msg.value != tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2)
            revert NotCorrectValue(tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2, msg.value);
        //in task state ResultsReceivedSuccessfully
        if (tasks[_taskID].taskState != TaskState.ResultsReceivedSuccessfully) 
            revert TaskNotInState(TaskState.ResultsReceivedSuccessfully);
        //in payment state Pending
        if (tasks[_taskID].paymentState != PaymentState.Pending) 
            revert PaymentNotInState(PaymentState.Pending);
        tasks[_taskID].provider.transfer(msg.value);
        emit TransferMadeToProvider(tasks[_taskID].provider, tasks[_taskID].price * tasks[_taskID].duration - tasks[_taskID].price * 2);
        clientPerformance[tasks[_taskID].client].upVotes += 1;
        emit ClientUpvoted(tasks[_taskID].client,_taskID);
        tasks[_taskID].paymentState = PaymentState.Completed;
        emit PaymentCompleted(_taskID, tasks[_taskID].client, tasks[_taskID].provider);
    }

    function reportClient(bytes32 _taskID) public {
       //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider(); 
        clientPerformance[tasks[_taskID].client].downVotes += 1;
        emit ClientDownvoted(tasks[_taskID].client,_taskID);
    }


    function getProviderPerformance(address provider) public view returns (providerRating memory) {
        return providerPerformance[provider];
        // tuple: upVotes, downVotes
    }

    function getClientPerformance(address client) public view returns (clientRating memory) {
        return clientPerformance[client];
        // tuple: upVotes, downVotes
    }

    function getCode(bytes32 _taskID) public view returns (string memory) {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider();
        //in task state Active
        if (tasks[_taskID].taskState != TaskState.Active) 
            revert TaskNotInState(TaskState.Active);
        return tasks[_taskID].code;
    }

    function getResults(bytes32 _taskID) public view returns (string memory)  {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //client only
        if (msg.sender != tasks[_taskID].client) 
            revert NotCalledByClient();
        //in task state ResultsReceivedSuccessfully
        if (tasks[_taskID].taskState != TaskState.ResultsReceivedSuccessfully) 
            revert TaskNotInState(TaskState.ResultsReceivedSuccessfully);
        //in payment state Completed
        if (tasks[_taskID].paymentState != PaymentState.Completed) 
            revert PaymentNotInState(PaymentState.Completed);
        return tasks[_taskID].results;
    }

    function getTasksByClient() public view returns (Task[] memory) {
        Task[] memory tasksByClient = new Task[](bytes32_tasks.length);
        uint counter = 0;
        for (uint i = 0; i < bytes32_tasks.length; i++) {
            if (tasks[bytes32_tasks[i]].client == msg.sender) {
                tasksByClient[counter] = tasks[bytes32_tasks[i]];
                counter++;
            }
        }
        Task[] memory ret = new Task[](counter);
        for (uint i = 0; i < counter; i++) 
        {
            ret[i] = tasksByClient[i];
        }
        return ret;
    }

    function getTasksByProvider() public view returns (Task[] memory) {
        Task[] memory tasksByProvider = new Task[](bytes32_tasks.length);
        uint counter = 0;
        for (uint i = 0; i < bytes32_tasks.length; i++) {
            if (tasks[bytes32_tasks[i]].provider == msg.sender) {
                tasksByProvider[counter] = tasks[bytes32_tasks[i]];
                counter++;
            }
        }
        Task[] memory ret = new Task[](counter);
         for (uint i = 0; i < counter; i++) 
        {
            ret[i] = tasksByProvider[i];
        }
        return ret;
    }

    function getProviderCollateral(bytes32 _taskID) public view returns (uint) {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //provider only
        if (msg.sender != tasks[_taskID].provider) 
            revert NotCalledByProvider();
        //in task state Created
        if (tasks[_taskID].taskState != TaskState.Created) 
            revert TaskNotInState(TaskState.Created);
        return tasks[_taskID].price * 10;
    }

    function getClientCollateral(bytes32 _taskID) public view returns (uint) {
        //registered task
        if (tasks[_taskID].taskID == bytes32(0)) 
            revert TaskDoesNotExist();
        //client only
        if (msg.sender != tasks[_taskID].client) 
            revert NotCalledByClient();
        //in task state Created
        if (tasks[_taskID].taskState != TaskState.Created) 
            revert TaskNotInState(TaskState.Created);
        return tasks[_taskID].price * 2;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getAuctionAddress() public  view returns (address) {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        return auctionAddress;
    }

    function getTasks() public view returns (Task[] memory) {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        Task[] memory ret = new Task[](bytes32_tasks.length);
        for (uint i = 0; i < bytes32_tasks.length; i++) {
            ret[i] = tasks[bytes32_tasks[i]];
        }
        return ret;
    }

    function getBank() public view returns (uint) {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        return bank;
    }

    function withdraw(uint amount) public {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        //correct amount
        if (amount > bank)
            revert NotCorrectValue(bank, amount);
        payable(owner).transfer(amount);
        bank -= amount;
    }


    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}