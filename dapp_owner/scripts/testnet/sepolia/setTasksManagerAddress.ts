import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../../../deployments/sepolia/AuctionsManager.json";
import { address as tasksAddress } from "../../../deployments/sepolia/TasksManager.json";
import { staller } from "../../staller";

const maxRetries = 5;
let retries = 0;

export async function setTasksManagerAddress() {
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    ethers.provider.getSigner()
  );
  await auctionsManager.setTasksManager(tasksAddress);
}

async function makeRequest() {
  try {
    await setTasksManagerAddress();
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
      await makeRequest();
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      // const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      // retries++;
      // console.log(`Retrying after ${retryAfter} ms...`);
      // await staller(retryAfter);
      // await makeRequest();
    } else {
      throw new Error(error);
    }
  }
}

export async function setTasksManagerAddressRequest() {
  makeRequest().catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}

setTasksManagerAddressRequest();
