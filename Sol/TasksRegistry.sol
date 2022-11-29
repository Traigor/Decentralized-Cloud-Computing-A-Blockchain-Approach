// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./ProvidersPerformance.sol";

contract TasksRegistry {

    address private owner = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; //address of my remix

    mapping (bytes32 => bool) private registryExists;    // it could also be only task address => bool
    ProvidersPerformance private immutable providersVote;

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

    constructor(ProvidersPerformance _providersPerformance) {
        providersVote = _providersPerformance;
    }

    function registerTask(address task) ownerOnly public {
      bytes32 hash = keccak256(abi.encodePacked(task));
      registryExists[hash] = true;
      emit TaskRegistered(task);
    }

    function unregisterTask() registeredTaskOnly() public {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        delete registryExists[hash];
        emit TaskUnregistered(msg.sender);
    }

    function isRegistered() public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        return registryExists[hash];
    }

    function upVoteProvider(address provider) registeredTaskOnly() public {
            providersVote.upVote(provider);
    }

    function downVoteProvider(address provider) registeredTaskOnly() public {
            providersVote.downVote(provider);
    }

    //to be deleted
    function testHash(address task) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(task)); //abi.encode if could occcure a collision of output (not possible in our case)
    }

    function testIsRegistered(address task) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(task));
        return registryExists[hash];
    }

    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}