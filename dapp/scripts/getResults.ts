import { ethers } from "hardhat";

export async function getResults(address: string, taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(client);
  const results = await task.getResults(taskID);

  console.log("----------------------------------------------------");
  console.log(`Results:\n ${results}\n`);
  console.log("----------------------------------------------------");
}
