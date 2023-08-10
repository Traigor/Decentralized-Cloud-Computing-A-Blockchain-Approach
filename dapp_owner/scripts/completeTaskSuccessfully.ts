import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function completeTaskSuccessfully(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, provider);
  const price = 30;
  const verification = "Helloworld!";
  const time = (await tasksManager.getActivationTime(taskID)).toNumber() + 10;
  await ethers.provider.send("evm_increaseTime", [10]);
  await tasksManager.completeTask(taskID, verification, 10, time);
  const taskState = await tasksManager.getTaskState(taskID);
  const paymentState = await tasksManager.getPaymentState(taskID);
  const payment = price * 10 - price * 2;
  console.log("----------------------------------------------------");
  console.log(
    `Task completed!\n Task ID: ${taskID}\n State: ${taskState}\n PaymentState: ${paymentState}`
  );
  console.log("----------------------------------------------------");
  return payment;
}
