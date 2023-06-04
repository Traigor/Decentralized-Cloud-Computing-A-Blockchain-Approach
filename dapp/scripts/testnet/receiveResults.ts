import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function receiveResults() {
  // const tasksManager = await ethers.getContract("TasksManager");
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  // const wei = 1000000000000000000;
  // const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";

  await tasksManager.receiveResults(taskID, "ipfsCID");

  const taskState = await tasksManager.getTaskState(taskID);
  const paymentState = await tasksManager.getPaymentState(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Received Results!\n Task ID: ${taskID}\n State: ${taskState}\n PaymentState: ${paymentState}`
  );
  console.log("----------------------------------------------------");
}

receiveResults().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
