import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function getResults(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);
  const results = await tasksManager.getResults(taskID);

  console.log("----------------------------------------------------");
  console.log(`Results:\n ${results}\n`);
  console.log("----------------------------------------------------");
}
