import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerMumbai.json";
import { staller } from "../staller";

const maxRetries = 10;
let retries = 0;

type TActivateTask = {
  taskID: string;
  price: number;
};
async function activateTask({ taskID, price }: TActivateTask) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const wei = 1000000000000000000;
  const providerCollateral = price * 10;

  const value = ethers.utils.parseEther(
    (providerCollateral / wei).toFixed(18).toString()
  );
  await tasksManager.activateTask(taskID, {
    value: value,
  });
}

async function makeRequest({ taskID, price }: TActivateTask) {
  try {
    await activateTask({ taskID, price });
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
      await makeRequest({ taskID, price });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 2000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      await makeRequest({ taskID, price });
    } else {
      throw new Error(error);
    }
  }
}

export async function activateTaskRequest({ taskID, price }: TActivateTask) {
  makeRequest({ taskID, price }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
