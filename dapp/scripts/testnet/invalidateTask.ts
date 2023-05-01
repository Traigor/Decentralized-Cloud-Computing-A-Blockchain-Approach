import { ethers, deployments } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function invalidateTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  // const tasksManager = await ethers.getContract("TasksManager");

  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";

  await tasksManager.invalidateTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task invalidated!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}

invalidateTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
