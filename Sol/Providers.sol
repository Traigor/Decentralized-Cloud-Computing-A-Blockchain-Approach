// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Providers {

    struct providerRating {
        uint votes;
        uint upVotes;
        uint downVotes;
    }

    mapping(address => providerRating) internal performance;

    event ProviderUpvoted(address provider);
    event ProviderDownvoted(address provider);

    function upVote(address provider) external {
        performance[provider].votes += 1;
        performance[provider].upVotes += 1;
        emit ProviderUpvoted(provider);
    }

    function downVote(address provider) external {
        performance[provider].votes += 1;
        performance[provider].downVotes += 1;
        emit ProviderDownvoted(provider);
    }

    function getPerformance(address provider) public view returns (providerRating memory) {
        return performance[provider];
        // tuple: votes, upVotes, downVotes
    }

}