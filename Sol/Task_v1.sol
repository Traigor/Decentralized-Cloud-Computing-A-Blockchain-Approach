// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
//taskID to be bytes32 instead of address


contract Task{

    enum State {
        Created,
        Cancelled,
        Active,
        Complete,
        Invalid
    }

    address payable internal provider;
    address payable internal client;
    address internal taskID; //by auction contract  //can be 
    
    uint internal payment;   //float at front-end
    uint internal collateral;   //float at front-end
    uint internal duration;  //contract duration, in ms
    uint internal activateDate = block.timestamp;   //contract activation date, in ms since epoch
    uint internal deadline;  //contract deadline, in ms since epoch
    uint internal timeResultReceived;    //time of received result, in ms since epoch   

    State internal state;   //state of contract

    string code;   //string for ipfs address 

    string internal clientVerification;
    string internal providerVerification;


    //Events
    event TaskCompleted(address taskID);
    event TaskCancelled(address taskID);
    event TaskInvalidated(address taskID);


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

    //Cancel
    //State -> Cancel
    //refunds payment to client
    //can be called only by client and only if contract hasnt been activated by provider
    function cancel() public requiresClient requiresState(State.Created)
    {
        state = State.Cancelled;
        payable(msg.sender).transfer(address(this).balance);

        emit TaskCancelled(taskID);
    }

    //Invalidate
    ///State -> Invalidate
    //can be called only by client and only if contract is activated
    //if time has passed and the task is not comleted by the provider
    //transfers payment and collateral to client
    function invalidate() public requiresClient requiresState(State.Active)
    {
        require(
            (block.timestamp * 1000 >  activateDate + duration),
            "...."
        );
        state = State.Invalid;
        //add transfer of payment

        emit TaskInvalidated(taskID);
    }

    
    //Setters
    function setProviderVerification (string memory ver) public {
        providerVerification = ver;
    }

    //could also be this.time
    function setTimeResultReceived (uint _timeReceived) public{
        timeResultReceived = _timeReceived;
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

    function getDeadline() public view returns (uint)
    {
        return deadline;
    }

    function getTimeResultReceived() public view returns (uint){
        return timeResultReceived;
    }

    function getCode() public view returns (string memory){
        return code;
    }

    //TODO: Add state transitions
    // State: Created->0, Cancelled->1, Active->2, Complete->3, Invalid->4
    function getStatus() public view returns (int8)
    {
        if (state == State.Created)
        {
            return 0;
        }
        else if (state == State.Cancelled)
        {
            return 1;
        }
        else if (state == State.Active)
        {
            return 2;
        }
        else if (state == State.Complete)
        {
            return 3;
        }
        else if (state == State.Invalid)
        {
            return 4;
        }
        else
        {
            return -1;
        }
    }
   
   function getClientVerification() public view returns (string memory){
        return clientVerification;
    }

    function getProviderVerification() public view returns (string memory){
        return providerVerification;
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
