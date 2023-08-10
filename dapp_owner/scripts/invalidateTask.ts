import { ethers, deployments } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function invalidateTask(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);

  await ethers.provider.send("evm_increaseTime", [610]);

  await tasksManager.invalidateTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task invalidated!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
