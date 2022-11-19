// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract ProvidersPerformance {

    modifier taskOnly() {
        require(
            exists(msg.sender),
            "Method can be called only by task contract."
        );
        _;
    }

    struct providerRating {
        uint upVotes;
        uint downVotes;
    }

    mapping(address => providerRating) private performance;
    address [] internal tasksRegistry;

    event ProviderUpvoted(address provider, address task);
    event ProviderDownvoted(address provider, address task);

    function registerTask(address _task) public {
        tasksRegistry.push(_task);
    }


    // function upVote(address provider) taskOnly external { 
    function upVote(address provider) external {
        // performance[provider].upVotes += 1;
        performance[provider].upVotes += 10; //for tests
        emit ProviderUpvoted(provider,msg.sender);
    }

    // function downVote(address provider) taskOnly external {
    function downVote(address provider) external {
        // performance[provider].downVotes += 1;
        performance[provider].downVotes += 10; //for tests
        emit ProviderDownvoted(provider,msg.sender);
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: upVotes, downVotes
    }

    function getScore(address provider) public view returns (uint) {
       return confidence(performance[provider].upVotes,performance[provider].downVotes);
    }

    function confidence(uint ups, uint downs) private pure returns (uint) {
        if (ups + downs == 0) 
            return 0;
        return calculateConfidence(ups,downs);
    }

    function calculateConfidence(uint ups, uint downs) private pure returns (uint) {
        //precision is 3 decimal digits
        uint n = ups + downs;

        uint z = 1960;  //z-score for 95% two-sided confidence = 1.96
        // uint z = 1645;  //z-score for 90% two-sided confidence = 1.645
        // uint z = 1440; //-score for 85% two-sided confidence = 1.44
        // uint z = 1282; //z-score for 80% two sided confidence = 1.282
        uint p = divider(ups,n,3);
        // return p;
        

        uint left = p + divider(1,2*n,3)*z*z/1000000; 
        // return left;
        uint right = z * sqrt(divider(p*(1000-p),n,0) + divider(z*z,4*n*n,0))/1000; 
        // return right;
        uint denominator = 1000 + divider(1,n,3)*z*z/1000000;
        // return denominator;

        return divider(left-right, denominator, 3);

    }
    
    function divider(uint numerator, uint denominator, uint precision) private pure returns(uint) {
        return numerator*(uint(10)**uint(precision))/denominator;
    }

    //babylonian method
    function sqrt(uint x) public pure returns (uint) {
        uint z = divider(x+1,2,0); 
        uint y = x;
        uint temp;
        while (z < y) {
            y = z;
            temp = divider(x,z,0);
            z = divider(temp+z,2,0);
        }
        return uint(y);
}

    //to be deleted
    function getTasksRegistry() public view returns (address [] memory) {
        return tasksRegistry;
    }

    //TODO: implement it with mapper
    //can be implemented with mapper -> O(1) but more storage
    //internal
    function exists(address adr) public view returns (bool) {
        for (uint i = 0; i < tasksRegistry.length; i++) {
            if (tasksRegistry[i] == adr) {
                return true;
            }
        }
        return false;
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}