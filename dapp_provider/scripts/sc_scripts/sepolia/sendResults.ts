import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;
type TSendResults = {
  taskID: string;
  resultsCID: string;
};
async function sendResults({ taskID, resultsCID }: TSendResults) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await tasksManager.sendResults(taskID, resultsCID);
}

async function makeRequest({ taskID, resultsCID }: TSendResults) {
  try {
    await sendResults({ taskID, resultsCID });
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
      await makeRequest({ taskID, resultsCID });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      await makeRequest({ taskID, resultsCID });
    } else {
      throw new Error(error);
    }
  }
}

export async function sendResultsRequest({ taskID, resultsCID }: TSendResults) {
  makeRequest({ taskID, resultsCID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
