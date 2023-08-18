import { ethers } from "hardhat";
import { address as auctionsAddress } from "../../../deployments/mumbai/AuctionsManager.json";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../../../deployments/mumbai/TasksManager.json";
import { staller } from "../../staller";

const maxRetries = 10;
let retries = 0;
export async function setAuctionsManagerAddress() {
  const tasksManager = new ethers.Contract(
    tasksAddress,
    tasksAbi,
    ethers.provider.getSigner()
  );
  await tasksManager.setAuctionsManager(auctionsAddress);
}

async function makeRequest() {
  try {
    await setAuctionsManagerAddress();
  } catch (error) {
    if (
      (error._isProviderError || error.code === "NETWORK_ERROR") &&
      retries < maxRetries
    ) {
      const retryAfter = Math.floor(Math.random() * 251) + 2000; // Generate a random wait time between 2000ms and 2250ms
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

export async function setAuctionsManagerAddressRequest() {
  makeRequest().catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}

setAuctionsManagerAddressRequest();
