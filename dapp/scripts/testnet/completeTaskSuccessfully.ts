import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function completeTaskSuccessfully() {
  // const tasksManager = await ethers.getContract("TasksManager");
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const verification = "Helloworld!";
  const time = Date.now();
  await tasksManager.completeTask(taskID, verification, time);
  const taskState = await tasksManager.getTaskState(taskID);
  const paymentState = await tasksManager.getPaymentState(taskID);
  const payment = await tasksManager.getPayment(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Task completed!\n Task ID: ${taskID}\n State: ${taskState}\n PaymentState: ${paymentState}\n Payment: ${payment}`
  );
  console.log("----------------------------------------------------");
}

completeTaskSuccessfully().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
