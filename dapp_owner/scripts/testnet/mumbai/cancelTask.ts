import { ethers } from "hardhat";
import { abi, address } from "../../../deployments/mumbai/TasksManager.json";
import { staller } from "../../staller";

const maxRetries = 5;
let retries = 0;
const taskID = process.env.TASK_ID;

export async function cancelTask() {
  // const tasksManager = await ethers.getContract("TasksManager");
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await tasksManager.cancelTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task cancelled!`);
  console.log("----------------------------------------------------");
}

async function makeRequest() {
  try {
    await cancelTask();
  } catch (error) {
    if (
      (error._isProviderError || error.code === "NETWORK_ERROR") &&
      retries < maxRetries
    ) {
      const retryAfter = Math.floor(Math.random() * 251) + 2000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      await staller(retryAfter);
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
