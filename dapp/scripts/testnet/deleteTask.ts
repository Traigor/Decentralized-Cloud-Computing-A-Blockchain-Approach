import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function deleteTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  await tasksManager.deleteTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task Deleted: ${taskID}`);
  console.log("----------------------------------------------------");
}

deleteTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
