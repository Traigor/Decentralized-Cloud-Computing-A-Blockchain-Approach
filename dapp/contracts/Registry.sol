// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Registry {

    address private immutable owner; 

    struct providerRating {
        uint upVotes;
        uint downVotes;
    }

    mapping(address => providerRating) private performance;
    mapping (bytes32 => bool) private registeredTask;    // it could also be only task address => bool

    event ProviderUpvoted(address provider, address task);
    event ProviderDownvoted(address provider, address task);
    event TaskRegistered(address task);
    event TaskUnregistered(address task);

    modifier ownerOnly() {
        require(
            msg.sender == owner,
            "Method can be called only by owner."
        );
        _;
    }

    modifier registeredTaskOnly() {
        require(
            isRegistered(),
            "Task must be registered"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function registerTask(address task) ownerOnly public {
      bytes32 hash = keccak256(abi.encodePacked(task));
      registeredTask[hash] = true;
      emit TaskRegistered(task);
    }

    function unregisterTask() registeredTaskOnly() public {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        delete registeredTask[hash];
        emit TaskUnregistered(msg.sender);
    }

    function isRegistered() public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        return registeredTask[hash];
    }

    function upVote(address provider) registeredTaskOnly public { 
    // function upVote(address provider) external {
        performance[provider].upVotes += 1;
        // performance[provider].upVotes += 10; //for tests
        emit ProviderUpvoted(provider,msg.sender);
    }

    function downVote(address provider) registeredTaskOnly external {
    // function downVote(address provider) external {
        performance[provider].downVotes += 1;
        // performance[provider].downVotes += 10; //for tests
        emit ProviderDownvoted(provider,msg.sender);
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: upVotes, downVotes
    }

    // could be calculated in the app
    // function getScore(address provider) public view returns (uint) {
    //    return confidence(performance[provider].upVotes,performance[provider].downVotes);
    // }

    // function confidence(uint ups, uint downs) private pure returns (uint) {
    //     if (ups + downs == 0) 
    //         return 0;

    //     //precision is 3 decimal digits
    //     uint n = ups + downs;

    //     uint z = 1960;  //z-score for 95% two-sided confidence = 1.96
    //     // uint z = 1645;  //z-score for 90% two-sided confidence = 1.645
    //     // uint z = 1440; //-score for 85% two-sided confidence = 1.44
    //     // uint z = 1282; //z-score for 80% two sided confidence = 1.282
        
    //     uint p = divider(ups,n,3);
    //     uint left = p + divider(1,2*n,3)*z*z/1000000; 
    //     uint right = z * sqrt(divider(p*(1000-p),n,0) + divider(z*z,4*n*n,0))/1000; 
    //     uint denominator = 1000 + divider(1,n,3)*z*z/1000000;

    //     return divider(left-right, denominator, 3);
    // }
    
    // function divider(uint numerator, uint denominator, uint precision) private pure returns(uint) {
    //     return numerator*(uint(10)**uint(precision))/denominator;
    // }

    // //babylonian method
    // function sqrt(uint x) private pure returns (uint) {
    //     uint z = divider(x+1,2,0); 
    //     uint y = x;
    //     uint temp;
    //     while (z < y) {
    //         y = z;
    //         temp = divider(x,z,0);
    //         z = divider(temp+z,2,0);
    //     }
    //     return uint(y);
    // }


    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}