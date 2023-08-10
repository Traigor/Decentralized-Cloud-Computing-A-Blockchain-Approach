import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function activateTask(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, provider);
  const price = 30;
  const providerCollateral = price * 10;
  const wei = 1000000000000000000;

  const value = ethers.utils.parseEther(
    (providerCollateral / wei).toFixed(18).toString()
  );
  await tasksManager.activateTask(taskID, { value: value });

  const taskState = await tasksManager.getTaskState(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task activated!\n Task ID: ${taskID}\n State: ${taskState}`);
  console.log("----------------------------------------------------");
}
