import { ethers } from "hardhat";
import { abi, address } from "../../../deployments/sepolia/TasksManager.json";

export async function ActiveTasks() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const activeTasks = await tasksManager.ActiveTasks();

  console.log("----------------------------------------------------");
  console.log(`Active Tasks: ${activeTasks}`);
  console.log("----------------------------------------------------");
}

ActiveTasks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
