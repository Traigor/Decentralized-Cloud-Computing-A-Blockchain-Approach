import { ethers } from "hardhat";

export async function deploy() {
  const TasksManager = await ethers.getContractFactory("TasksManager");
  const tasksManager = await TasksManager.deploy();

  await tasksManager.deployed();
  console.log("TasksManager deployed to:", tasksManager.address);

  const AuctionsManager = await ethers.getContractFactory("AuctionsManager");
  const auctionsManager = await AuctionsManager.deploy();

  await auctionsManager.deployed();
  console.log("AuctionsManager deployed to:", auctionsManager.address);
  return auctionsManager.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
