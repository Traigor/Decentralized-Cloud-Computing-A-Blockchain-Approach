import { ethers } from "hardhat";

export async function cancelTask() {
  const tasksManager = await ethers.getContract("TasksManager");

  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";

  await tasksManager.cancelTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task cancelled!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}

cancelTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
