// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./TasksManager.sol";

contract AuctionsManager {
     address private immutable owner; 
     TasksManager tasksManager;

     enum AuctionState {
        Created,
        Cancelled, 
        Finalized
    }

    struct Auction {
        bytes32 auctionID;
        address client;
        uint creationTime;
        uint auctionDeadline;
        uint taskDeadline;
        bytes32 clientVerification;
        bytes32 taskID;
        string code;
        ProviderBid[] providerBids;
        WinnerBid winnerBid;
        AuctionState auctionState;   
    }

    struct ProviderBid {
        address provider;
        uint bid;
        uint providerUpVotes;
        uint providerDownVotes;
    }

    struct WinnerBid {
        address provider;
        uint bid;
    }

    mapping (bytes32 => Auction) private auctions;
    bytes32[] private bytes32_auctions;

    //Events
    event AuctionCreated(bytes32 auctionID, address client);
    event AuctionCancelled(bytes32 auctionID, address client);
    event AuctionFinalized(bytes32 auctionID, address client, address provider);
    event AuctionDeleted(bytes32 auctionID);
    event BidPlaced(bytes32 auctionID, address provider, uint bid);
    event TaskIDCreated(bytes32 auctionID, bytes32 taskID, address client, address provider);

    //Errors
    error NotCalledByOwner();
    error NotCalledByClient();
    error AuctionDoesNotExist();
    error AuctionNotInState(AuctionState auctionState);

    constructor()  {
        owner = msg.sender;
    }

    function setTasksManager(address payable _tasksManagerAddress) public  {
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        tasksManager = TasksManager(_tasksManagerAddress);
    }

    function createAuction(
        uint _auctionDeadline, 
        uint _taskDeadline,
        bytes32 _clientVerification,
        string memory _code
    ) public 
    {
        bytes32 _auctionID = keccak256(abi.encode(block.timestamp, msg.sender, _auctionDeadline, _taskDeadline, _clientVerification, _code));
        auctions[_auctionID].auctionID = _auctionID;
        auctions[_auctionID].client = msg.sender;
        auctions[_auctionID].creationTime = block.timestamp;
        auctions[_auctionID].auctionDeadline = _auctionDeadline;
        auctions[_auctionID].taskDeadline = _taskDeadline;
        auctions[_auctionID].clientVerification = _clientVerification;
        auctions[_auctionID].code = _code;

        auctions[_auctionID].auctionState = AuctionState.Created;
        bytes32_auctions.push(_auctionID);
        emit AuctionCreated( _auctionID, msg.sender);
    }

    function cancelAuction(bytes32 _auctionID) public   {
        //existing auction
        if (auctions[_auctionID].auctionID == bytes32(0))
            revert AuctionDoesNotExist();   
        //client only
        if (msg.sender != auctions[_auctionID].client) 
            revert NotCalledByClient();
        //in auction state Created
        if (auctions[_auctionID].auctionState != AuctionState.Created) 
            revert AuctionNotInState(AuctionState.Created);
        auctions[_auctionID].auctionState = AuctionState.Cancelled;
        emit AuctionCancelled(_auctionID, auctions[_auctionID].client);
     }

    function bid(bytes32 _auctionID, uint _bid) public {
        //existing auction
        if (auctions[_auctionID].auctionID == bytes32(0))
            revert AuctionDoesNotExist();
        //in auction state Created
        if (auctions[_auctionID].auctionState != AuctionState.Created) 
            revert AuctionNotInState(AuctionState.Created);
        require(msg.sender != auctions[_auctionID].client, "Client can't bid to this auction"); 
        require(
            (block.timestamp <= auctions[_auctionID].creationTime + auctions[_auctionID].auctionDeadline),
            "Time has expired."
        );
        uint providerIndex = 0;
        bool providerExists = false;
        if(auctions[_auctionID].providerBids.length != 0)
        {    while(auctions[_auctionID].providerBids[providerIndex].provider != msg.sender)
            {
                providerIndex++;
                if(providerIndex > auctions[_auctionID].providerBids.length)
                    break;
            }
            if (providerIndex <= auctions[_auctionID].providerBids.length)
            {
                require(
                _bid < auctions[_auctionID].providerBids[providerIndex].bid,
                "Bid is not lower than than the previous one."
                );
                providerExists = true;
            }
        }
        if(providerExists == true)
        {
            auctions[_auctionID].providerBids[providerIndex].bid = _bid;
            auctions[_auctionID].providerBids[providerIndex].providerUpVotes = tasksManager.getPerformance(msg.sender).upVotes;
            auctions[_auctionID].providerBids[providerIndex].providerDownVotes = tasksManager.getPerformance(msg.sender).downVotes;
        }
        else 
        {
            ProviderBid memory currentBid;
            currentBid.provider = msg.sender;
            currentBid.bid = _bid;
            currentBid.providerUpVotes = tasksManager.getPerformance(msg.sender).upVotes;
            currentBid.providerDownVotes = tasksManager.getPerformance(msg.sender).downVotes;
            auctions[_auctionID].providerBids.push(currentBid);
        }
        emit BidPlaced(_auctionID, msg.sender, _bid);
     }

    function finalize(bytes32 _auctionID, address _provider) public payable  {
        //existing auction
        if (auctions[_auctionID].auctionID == bytes32(0))
            revert AuctionDoesNotExist();
        //client only
        if (msg.sender != auctions[_auctionID].client) 
            revert NotCalledByClient();
        //in auction state Created
        if (auctions[_auctionID].auctionState != AuctionState.Created) 
            revert AuctionNotInState(AuctionState.Created);
        uint providerIndex = 0;
        if (auctions[_auctionID].providerBids.length == 0)
            revert("Auction has no bids.");
        while(auctions[_auctionID].providerBids[providerIndex].provider != _provider)
        {
            providerIndex++;
            if(providerIndex >= auctions[_auctionID].providerBids.length)
                break;
        }
        if(providerIndex >= auctions[_auctionID].providerBids.length)
         revert("Wrong provider address");
        WinnerBid memory _winnerBid;
        _winnerBid.provider = _provider;
        _winnerBid.bid = auctions[_auctionID].providerBids[providerIndex].bid;
        require (msg.value ==(_winnerBid.bid * 2), "Client collateral is not correct");
        auctions[_auctionID].winnerBid = _winnerBid;
        Auction storage currentAuction = auctions[_auctionID];
        auctions[_auctionID].auctionState = AuctionState.Finalized;
        emit AuctionFinalized(_auctionID, auctions[_auctionID].client,  _provider);
        bytes32 taskID = keccak256(abi.encode(currentAuction.client, _winnerBid, block.timestamp));
        auctions[_auctionID].taskID = taskID;
        emit TaskIDCreated(_auctionID, taskID, auctions[_auctionID].client , _provider);
        uint clientCollateral = auctions[_auctionID].winnerBid.bid * 2;
        tasksManager.createTask{value: clientCollateral}(taskID, currentAuction.client, _provider,  _winnerBid.bid, currentAuction.taskDeadline, currentAuction.clientVerification,currentAuction.code);
    }

    function deleteAuction(bytes32 _auctionID) public {
        //existing auction
        if (auctions[_auctionID].auctionID == bytes32(0))
            revert AuctionDoesNotExist();
        //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        delete(auctions[_auctionID]);
        for (uint i=0; i < bytes32_auctions.length; i++)
        {
            if (bytes32_auctions[i] == _auctionID)
            {
                bytes32_auctions[i] = bytes32_auctions[bytes32_auctions.length - 1];
                bytes32_auctions.pop();
                break;
            }
        }
        emit AuctionDeleted(_auctionID);
    }

    function getActiveAuctions() public view returns (Auction[] memory) {
        Auction[] memory activeAuctions = new Auction[](bytes32_auctions.length);
        uint auctionsLength = 0;
        for (uint i = 0; i < bytes32_auctions.length; i++)
        {
            if (auctions[bytes32_auctions[i]].auctionState == AuctionState.Created && block.timestamp <= auctions[bytes32_auctions[i]].creationTime + auctions[bytes32_auctions[i]].auctionDeadline && auctions[bytes32_auctions[i]].client != msg.sender)
            {
                activeAuctions[auctionsLength] = auctions[bytes32_auctions[i]];
                auctionsLength++;
            }
        }
         Auction[] memory result = new Auction[](auctionsLength);
        for (uint i = 0; i < auctionsLength; i++) 
        {
            result[i] = activeAuctions[i];
        }
        return result;
    }



    function getAuctionBids(bytes32 _auctionID) public view returns(ProviderBid[] memory) {
        return auctions[_auctionID].providerBids;
    }

    function getAuctionsByClient() public view returns(Auction[] memory)
    {
        Auction[] memory auctionsByClient = new Auction[](bytes32_auctions.length);
        uint auctionsLength = 0;
        for (uint i = 0; i < bytes32_auctions.length; i++)
        {
            if (auctions[bytes32_auctions[i]].client == msg.sender)
            {
                auctionsByClient[auctionsLength] = auctions[bytes32_auctions[i]];
                auctionsLength++;
            }
        }
        Auction[] memory result = new Auction[](auctionsLength);
        for (uint i = 0; i < auctionsLength; i++) 
        {
            result[i] = auctionsByClient[i];
        }
        return result;
    }

    function getAuctionWinnersByProvider() public view returns(Auction[] memory)
    {
        Auction[] memory auctionsByProvider = new Auction[](bytes32_auctions.length);
        uint auctionsLength = 0;
        for (uint i = 0; i < bytes32_auctions.length; i++)
        {
            if (auctions[bytes32_auctions[i]].winnerBid.provider == msg.sender)
            {
                auctionsByProvider[auctionsLength] = auctions[bytes32_auctions[i]];
                auctionsLength++;
            }
        }
        Auction[] memory result = new Auction[](auctionsLength);
        for (uint i = 0; i < auctionsLength; i++) 
        {
            result[i] = auctionsByProvider[i];
        }
        return result;
    }

    function getAuctionActiveBidsByProvider() public view returns (Auction[] memory) 
    {
        Auction[] memory activeBidsByProvider = new Auction[](bytes32_auctions.length);
        uint auctionsLength = 0;
        for (uint i = 0; i < bytes32_auctions.length; i++)
        {
            if (auctions[bytes32_auctions[i]].auctionState == AuctionState.Created && block.timestamp <= auctions[bytes32_auctions[i]].creationTime + auctions[bytes32_auctions[i]].auctionDeadline)
            {
                for (uint j = 0; j < auctions[bytes32_auctions[i]].providerBids.length; j++)
                {
                    if (auctions[bytes32_auctions[i]].providerBids[j].provider == msg.sender)
                    {
                        activeBidsByProvider[auctionsLength] = auctions[bytes32_auctions[i]];
                        auctionsLength++;
                        break;
                    }
                }
            }
        }
        Auction[] memory result = new Auction[](auctionsLength);
        for (uint i = 0; i < auctionsLength; i++) 
        {
            result[i] = activeBidsByProvider[i];
        }
        return result;
    }

    function getOwner() public view returns(address) {
        return owner;
    }
    
    function getTasksManager() public view returns(address) {
         //owner only
        if (msg.sender != owner) 
            revert NotCalledByOwner();
        return address(tasksManager);
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}