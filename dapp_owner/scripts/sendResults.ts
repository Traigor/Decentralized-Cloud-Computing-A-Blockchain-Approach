import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function sendResults(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, provider);

  await tasksManager.sendResults(taskID, "ipfsCID");
  const taskState = await tasksManager.getTaskState(taskID);
  const paymentState = await tasksManager.getPaymentState(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Received Results!\n Task ID: ${taskID}\n State: ${taskState}\n PaymentState: ${paymentState}`
  );
  console.log("----------------------------------------------------");
}
