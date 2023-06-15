import { ethers } from "hardhat";

export async function completePayment(
  address: string,
  payment: number,
  taskID: string
) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = tasksManagerContract.attach(address);
  const task = tasksManager.connect(client);
  const wei = 1000000000000000000;
  // tasksManager.once("PaymentPending", async (_, payment) => {
  const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());

  await task.completePayment(taskID, {
    value: value,
  });

  console.log("----------------------------------------------------");
  console.log(`Payment completed!\n Task ID: ${taskID}\n Payment: ${payment}`);
  console.log("----------------------------------------------------");
  // });
}
