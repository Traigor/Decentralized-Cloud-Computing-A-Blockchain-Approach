import { ethers } from "hardhat";
import { abi, address } from "../../../deployments/mumbai/TasksManager.json";
const taskID = process.env.TASK_ID;

export async function getResults() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const results = await tasksManager.getResults(taskID);

  console.log("----------------------------------------------------");
  console.log(`Results: ${results}`);
  console.log("----------------------------------------------------");
}

getResults().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
