import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;
type TCancelTask = {
  taskID: string;
};
async function cancelTask({ taskID }: TCancelTask) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await tasksManager.cancelTask(taskID);
}

async function makeRequest({ taskID }: TCancelTask) {
  try {
    await cancelTask({ taskID });
  } catch (error) {
    if (
      (error._isProviderError || error.code === "NETWORK_ERROR") &&
      retries < maxRetries
    ) {
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      await staller(retryAfter);
      await makeRequest({ taskID });
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
    } else {
      throw new Error(error);
    }
  }
}
export async function cancelTaskRequest({ taskID }: TCancelTask) {
  makeRequest({ taskID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
