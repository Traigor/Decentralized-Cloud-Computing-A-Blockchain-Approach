import { ethers } from "hardhat";

export async function completeTaskUnsuccessfully(
  address: string,
  taskID: string
) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  //   const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(provider);

  const verification = "Helloworld!!(wrong)";
  //   const verification = "Helloworld!";
  //   const time = (await task.getActivationTime(taskID)).toNumber() + 610;
  //   await ethers.provider.send("evm_increaseTime", [610]);
  const time = (await task.getActivationTime(taskID)).toNumber() + 10;
  await ethers.provider.send("evm_increaseTime", [10]);
  await task.completeTask(taskID, verification, 10, time);

  console.log("----------------------------------------------------");
  console.log(`Task completed!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
