import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function deleteTasks() {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, deployer);
  const previousActiveTasks = await tasksManager.getActiveTasks();
  await ethers.provider.send("evm_increaseTime", [240]);
  (await tasksManager.deleteTasks()).wait();
  const currentActiveTasks = await tasksManager.getActiveTasks();
  console.log("----------------------------------------------------");
  console.log(
    `Tasks deleted!\n Previous active tasks: ${previousActiveTasks}\n Current active tasks: ${currentActiveTasks}`
  );
  console.log("----------------------------------------------------");
}
