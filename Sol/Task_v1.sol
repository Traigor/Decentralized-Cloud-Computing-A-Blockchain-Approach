// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
//taskID to be byted32 instead of address


contract Task{

    enum State {
        Created,
        Cancelled,
        Active,
        Completed,
        Invalid
    }

    address payable internal provider;
    address payable internal client;
    address internal taskID; //by auction contract  //can be bytes32
    
    uint internal payment;   //can be float at front-end
    uint internal collateral;   //can be float at front-end
    uint internal duration;  //contract duration, in sec
    uint internal activateDate;   //contract activation date, in sec since epoch

    uint internal timeResultProvided;     //time of result given by provider, in sec since epoch
    uint internal timeResultReceived;    //time of received result, in sec since epoch   

    State internal state;   //state of contract

    string code;   //string for ipfs address 

    string internal clientVerification;
    string internal providerVerification;


    //Events
    event TaskCompleted(address taskID);
    event TaskCancelled(address taskID);
    event TaskInvalidated(address taskID);
    event TransferMade(address Address, uint Amount);

    //Modifiers 
    modifier requiresClient() {
        require(
            msg.sender == client,
            "Method can be called only by client."
        );
        _;
    }

    modifier requiresProvider() {
        require(
            msg.sender == provider,
            "Method can be called only by provider."
        );
        _;
    }

    modifier requiresState(State _state) {
        require(
            state == _state,
            "Invalid State."
        );
        _;
    }


    //Constructor
    constructor(
        address _taskID,
        address payable _client,
        address payable _provider,
        uint _payment,
        uint _collateral,
        uint _duration,
        string memory _clientVerification 
    )
    payable
    {
        taskID = _taskID;
        client = _client;
        provider = _provider;
        payment = _payment;
        collateral = _collateral;
        duration = _duration; 
        clientVerification = _clientVerification;
        state = State.Created;
    }

    //  States to be called by smart contract or client/provider? 

    //Cancel
    //State -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider

    // - no requiresClient so that it can be tested
    // function cancelContract() public payable requiresClient requiresState(State.Created) 
    function cancelContract() public payable requiresState(State.Created)
    {
        state = State.Cancelled;
        // payable(msg.sender).transfer(address(this).balance);
        // sender is client, balance is payment, the contract is not activated so there is not collateral
        client.transfer(payment);
        emit TransferMade(client,payment);
        emit TaskCancelled(taskID);
    }

    //Invalidate
    ///State -> Invalidate
    //can be called only by client and only if contract is activated  // no by client but auto?
    //if time has passed and the task is not comleted by the provider
    //transfers payment and collateral to client
    
    // - no requiresClient so that it can be tested
    // function invalidateContract() public payable requiresClient requiresState(State.Active)
    function invalidateContract() public payable requiresState(State.Active)
    {
        require(
            (block.timestamp >  activateDate + duration),
            "Time has not expired"
        );
        state = State.Invalid;
        //add transfer of payment

        // payable(msg.sender).transfer(address(this).balance);
        uint payAmount = payment + collateral;
        client.transfer(payAmount);
        emit TransferMade(client, payAmount);
        emit TaskInvalidated(taskID);
    }

    // Activate
    // State -> Activated
    // can be called only by provider to start the process

    // - no requiresProvider so that it can be tested
    // function activateContract() public requiresProvider requiresState(State.Created)
    function activateContract() public requiresState(State.Created)
    {
        activateDate = block.timestamp;
        state = State.Active;
    }


    // Complete
    // State -> Completed
    // can be called only by provider when the computation is over

    // - no requiresProvider so that it can be tested
    // function completeContract() public payable requiresProvider requiresState(State.Active)
    function completeContract() public payable requiresState(State.Active)
    {
        state = State.Completed;
        // payable(msg.sender).transfer(address(this).balance);
        uint payAmount = payment + collateral;
        if (InTime() && CorrectVerification()){
            provider.transfer(payment+collateral);
            emit TransferMade(provider, payAmount);
        }
        else {
            emit TransferMade(client, payAmount);
            client.transfer(payment+collateral);
        }
        
        emit TaskCompleted(taskID);
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

    function getPayment() public view returns (uint)
    {
        return payment;
    }

    function getCollateral() public view returns (uint)
    {
        return collateral;
    }

    function getDuration() public view returns (uint)
    {
        return duration;
    }

    function getActivateDate() public view returns (uint)
    {
        return activateDate;
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

    //TODO: Add state transitions
    // State: Created->0, Cancelled->1, Active->2, Complete->3, Invalid->4
    function getState() public view returns (State)
    {
        return state;
        // if (state == State.Created)
        // {
        //     return 0;
        // }
        // else if (state == State.Cancelled)
        // {
        //     return 1;
        // }
        // else if (state == State.Active)
        // {
        //     return 2;
        // }
        // else if (state == State.Completed)
        // {
        //     return 3;
        // }
        // else if (state == State.Invalid)
        // {
        //     return 4;
        // }
        // else
        // {
        //     return -1;
        // }
    }
   
   function getClientVerification() public view returns (string memory){
        return clientVerification;
    }

    function getProviderVerification() public view returns (string memory){
        return providerVerification;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    //Functions
    function InTime() public view returns (bool){
        return ((block.timestamp <= (activateDate + duration)) && (timeResultReceived <= activateDate + duration));     //first argument may be deleted
    }

    function CorrectVerification() public view returns (bool){
        return (keccak256(abi.encodePacked(clientVerification)) == keccak256(abi.encodePacked(providerVerification)));    //use hash of bytes to compare strings
    }

    function getSC_Address() public view returns (address)  //returns address of smart contract
    {
        return address(this);
    }

}
