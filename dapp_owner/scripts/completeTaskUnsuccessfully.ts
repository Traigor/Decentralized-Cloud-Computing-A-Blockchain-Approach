import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function completeTaskUnsuccessfully(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, provider);

  const verification = "Helloworld!!(wrong)";
  //   const verification = "Helloworld!";
  //   const time = (await task.getActivationTime(taskID)).toNumber() + 610;
  //   await ethers.provider.send("evm_increaseTime", [610]);
  const time = (await tasksManager.getActivationTime(taskID)).toNumber() + 10;
  await ethers.provider.send("evm_increaseTime", [10]);
  await tasksManager.completeTask(taskID, verification, 10, time);

  console.log("----------------------------------------------------");
  console.log(`Task completed!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
