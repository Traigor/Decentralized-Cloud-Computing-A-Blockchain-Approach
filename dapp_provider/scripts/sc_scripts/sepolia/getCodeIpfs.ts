import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;

type TGetCode = {
  taskID: string;
};
async function getCode({ taskID }: TGetCode) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const code = await tasksManager.getCode(taskID);
  return code;
}

async function makeRequest({ taskID }: TGetCode) {
  try {
    const code = await getCode({ taskID });
    return code;
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
      const code = await makeRequest({ taskID });
      return code;
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      const code = await makeRequest({ taskID });
      return code;
    } else {
      throw new Error(error);
    }
  }
}

export async function getCodeRequest({ taskID }: TGetCode) {
  const code = makeRequest({ taskID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
  return code;
}
