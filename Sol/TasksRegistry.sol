// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./ProvidersPerformance.sol";

contract TasksRegistry {

    address private owner;

    mapping (bytes32 => bool) public registryExists;
    
    event TaskRegistered(address client,address provider,bytes32 taskID);
    event TaskUnregistered(address client,address provider,bytes32 taskID);

    ProvidersPerformance private immutable providersVote;

    constructor(ProvidersPerformance _providersPerformance) {
        owner = msg.sender;
        providersVote = _providersPerformance;
    }

    function registerTask(address client, address provider, bytes32 taskID) public {
      bytes32 hash = keccak256(abi.encodePacked(client,provider,taskID));
      registryExists[hash] = true;
      emit TaskRegistered(client,provider,taskID);
    }

    function unregisterTask(address client, address provider, bytes32 taskID) public {
        bytes32 hash = keccak256(abi.encodePacked(client,provider,taskID));
        delete registryExists[hash];
        emit TaskUnregistered(client,provider,taskID);
    }

    //to be deleted
    function testHash(address client, address provider, bytes32 taskID) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(client,provider,taskID));
    }

    function isRegistered(address client, address provider, bytes32 taskID) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(client,provider,taskID));
        return registryExists[hash];
    }

    function upVoteProvider(address client, address provider, bytes32 taskID) public {
        if (isRegistered(client,provider,taskID)) {
            providersVote.upVote(provider);
        }
    }

    function downVoteProvider(address client, address provider, bytes32 taskID) public {
        if (isRegistered(client,provider,taskID)) {
            providersVote.downVote(provider);
        }
    }

    function getOWner() public view returns (address) {
        return owner;
    }




    // Fallback Function
    fallback() external payable{
        revert();
    }

    receive() external payable {
        revert("bad call");
    }
}