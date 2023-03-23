import { ethers } from "hardhat";

export async function completeTaskUnsuccessfully() {
  const tasksManager = await ethers.getContract("TasksManager");

  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const verification = "Helloworld!!(wrong)";
  const time = Date.now();
  await tasksManager.completeTask(taskID, verification, time);

  console.log("----------------------------------------------------");
  console.log(`Task completed!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}

completeTaskUnsuccessfully().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
