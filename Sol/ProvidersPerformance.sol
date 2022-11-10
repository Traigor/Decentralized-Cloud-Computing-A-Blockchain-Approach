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
        uint votes;
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

    function upVote(address provider) taskOnly external { 
    // function upVote(address provider) external {
        performance[provider].votes += 1;
        performance[provider].upVotes += 1;
        emit ProviderUpvoted(provider,msg.sender);
    }

    function downVote(address provider) taskOnly external {
    // function downVote(address provider) external {
        performance[provider].votes += 1;
        performance[provider].downVotes += 1;
        emit ProviderDownvoted(provider,msg.sender);
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: votes, upVotes, downVotes
    }
    
    //to be deleted
    function getTasksRegistry() public view returns (address [] memory) {
        return tasksRegistry;
    }

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