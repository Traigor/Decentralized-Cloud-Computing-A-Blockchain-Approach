import { ethers } from "hardhat";

export async function sendResults(address: string, taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  //   const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(provider);

  await task.sendResults(taskID, "ipfsCID");
  const taskState = await task.getTaskState(taskID);
  const paymentState = await task.getPaymentState(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Received Results!\n Task ID: ${taskID}\n State: ${taskState}\n PaymentState: ${paymentState}`
  );
  console.log("----------------------------------------------------");
}
