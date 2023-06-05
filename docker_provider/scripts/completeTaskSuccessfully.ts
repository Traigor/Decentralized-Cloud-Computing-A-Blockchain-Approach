import { ethers } from "hardhat";
import { abi, address } from "../TasksManager.json";
import { splitFields } from "../splitFields";

export async function completeTaskSuccessfully() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const { verification, duration, time } = splitFields();
  await tasksManager.completeTask(taskID, verification, duration, time);
}

completeTaskSuccessfully().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
