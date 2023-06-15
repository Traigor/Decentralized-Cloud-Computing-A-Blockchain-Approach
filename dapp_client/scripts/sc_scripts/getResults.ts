import { ethers } from "hardhat";
import { abi, address } from "../../TasksManager.json";
import { staller } from "./staller";

type TGetResults = {
  taskID: string;
};

const maxRetries = 5;
let retries = 0;

async function getResults({ taskID }: TGetResults): Promise<string> {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const results = await tasksManager.getResults(taskID);
  return results;
}

async function makeRequest({ taskID }: TGetResults) {
  try {
    const performance = await getResults({ taskID });
    return performance;
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

export async function getResultsRequest({
  taskID,
}: TGetResults): Promise<string | void> {
  const results = await makeRequest({ taskID }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  return results;
}
