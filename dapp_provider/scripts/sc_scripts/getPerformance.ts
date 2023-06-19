import { ethers } from "hardhat";
import { abi, address } from "../../TasksManager.json";
import { staller } from "./staller";

const maxRetries = 5;
let retries = 0;

async function getPerformance(provider: string) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const performance = await tasksManager.getPerformance(provider);

  return performance;
}

async function makeRequest(provider: string) {
  try {
    const performance = await getPerformance(provider);
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
      const performance = await makeRequest(provider);
      return performance;
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      const performance = await makeRequest(provider);
      return performance;
    } else {
      throw new Error(error);
    }
  }
}

export async function getPerformanceRequest(provider: string) {
  const performance = await makeRequest(provider).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  return performance;
}
