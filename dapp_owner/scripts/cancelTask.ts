import { ethers, deployments } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function cancelTask(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);

  await tasksManager.cancelTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task cancelled!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
