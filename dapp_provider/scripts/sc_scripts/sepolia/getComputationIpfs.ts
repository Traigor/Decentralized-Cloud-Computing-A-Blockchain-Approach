import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;

type TGetComputationCode = {
  taskID: string;
};
async function getComputationCode({ taskID }: TGetComputationCode) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const computationCode = await tasksManager.getComputationCode(taskID);
  return computationCode;
}

async function makeRequest({ taskID }: TGetComputationCode) {
  try {
    const computationCode = await getComputationCode({ taskID });
    return computationCode;
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
      const computationCode = await makeRequest({ taskID });
      return computationCode;
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      const computationCode = await makeRequest({ taskID });
      return computationCode;
    } else {
      throw new Error(error);
    }
  }
}

export async function getComputationCodeRequest({
  taskID,
}: TGetComputationCode) {
  const computationCode = makeRequest({ taskID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
  return computationCode;
}
