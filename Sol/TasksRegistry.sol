// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./ProvidersPerformance.sol";

contract TasksRegistry {

    address private owner = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; //address of my remix

    mapping (bytes32 => bool) public registryExists;
    ProvidersPerformance private immutable providersVote;

    event TaskRegistered(address client,address provider,address task);
    event TaskUnregistered(address client,address provider,address task);
    
    modifier ownerOnly() {
        require(
            msg.sender == owner,
            "Method can be called only by owner."
        );
        _;
    }

    modifier registeredTaskOnly(address client, address provider) {
        require(
            isRegistered(client,provider),
            "Task must be registered"
        );
        _;
    }

    constructor(ProvidersPerformance _providersPerformance) {
        providersVote = _providersPerformance;
    }

    function registerTask(address client, address provider, address task) ownerOnly public {
      bytes32 hash = keccak256(abi.encodePacked(client,provider,task));
      registryExists[hash] = true;
      emit TaskRegistered(client,provider,task);
    }

    function unregisterTask(address client, address provider) registeredTaskOnly(client,provider) public {
        bytes32 hash = keccak256(abi.encodePacked(client,provider,msg.sender));
        delete registryExists[hash];
        emit TaskUnregistered(client,provider,msg.sender);
    }

    function isRegistered(address client, address provider) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(client,provider,msg.sender));
        return registryExists[hash];
    }

    function upVoteProvider(address client, address provider) registeredTaskOnly(client,provider) public {
            providersVote.upVote(provider);
    }

    function downVoteProvider(address client, address provider) registeredTaskOnly(client,provider) public {
            providersVote.downVote(provider);
    }

    //to be deleted
    function testHash(address client, address provider, address task) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(client,provider,task)); //abi.encode if could occcure a collision of output (not possible in our case)
    }

    function testIsRegistered(address client, address provider, address task) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(client,provider,task));
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