import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function completePayment(payment: number, taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);
  const wei = 1000000000000000000;
  // tasksManager.once("PaymentPending", async (_, payment) => {
  const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());

  await tasksManager.completePayment(taskID, {
    value: value,
  });

  console.log("----------------------------------------------------");
  console.log(`Payment completed!\n Task ID: ${taskID}\n Payment: ${payment}`);
  console.log("----------------------------------------------------");
  // });
}
