import { ethers } from "hardhat";

export async function deleteTasks(address: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(deployer);
  const previousActiveTasks = await task.getActiveTasks();
  await ethers.provider.send("evm_increaseTime", [240]);
  (await task.deleteTasks()).wait();
  const currentActiveTasks = await task.getActiveTasks();
  console.log("----------------------------------------------------");
  console.log(
    `Tasks deleted!\n Previous active tasks: ${previousActiveTasks}\n Current active tasks: ${currentActiveTasks}`
  );
  console.log("----------------------------------------------------");
}