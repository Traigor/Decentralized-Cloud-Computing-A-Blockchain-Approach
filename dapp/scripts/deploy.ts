import { ethers } from "hardhat";

async function main() {
  const TasksManager = await ethers.getContractFactory("TasksManager");
  const tasksManager = await TasksManager.deploy();

  await tasksManager.deployed();
  console.log("TasksManager deployed to:", tasksManager.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
