import { ethers, deployments } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;
const taskID = process.env.TASK_ID;

export async function invalidateTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  // const tasksManager = await ethers.getContract("TasksManager");

  await tasksManager.invalidateTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task invalidated!`);
  console.log("----------------------------------------------------");
}

async function makeRequest() {
  try {
    await invalidateTask();
  } catch (error) {
    if (error._isProviderError && !error.reason && retries < maxRetries) {
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      staller(retryAfter);
      await makeRequest();
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
    } else {
      throw new Error(error);
    }
  }
}
makeRequest().catch((error) => {
  if (!error._isProviderError) console.error(error);
});
