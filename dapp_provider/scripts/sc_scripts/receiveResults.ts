import { ethers } from "hardhat";
import { abi, address } from "../../TasksManager.json";
import { staller } from "./staller";

const maxRetries = 10;
let retries = 0;
type TReceiveResults = {
  taskID: string;
  resultsCID: string;
};
async function receiveResults({ taskID, resultsCID }: TReceiveResults) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await tasksManager.receiveResults(taskID, resultsCID);
}

async function makeRequest({ taskID, resultsCID }: TReceiveResults) {
  try {
    await receiveResults({ taskID, resultsCID });
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
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
    } else {
      throw new Error(error);
    }
  }
}

export async function receiveResultsRequest({
  taskID,
  resultsCID,
}: TReceiveResults) {
  makeRequest({ taskID, resultsCID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
