import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerMumbai.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;

type TGetVerificationCode = {
  taskID: string;
};
async function getVerificationCode({ taskID }: TGetVerificationCode) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const verificationCode = await tasksManager.getVerificationCode(taskID);
  return verificationCode;
}

async function makeRequest({ taskID }: TGetVerificationCode) {
  try {
    const verificationCode = await getVerificationCode({ taskID });
    return verificationCode;
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
      const verificationCode = await makeRequest({ taskID });
      return verificationCode;
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 2000; // Generate a random wait time between 2000ms and 2250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      const verificationCode = await makeRequest({ taskID });
      return verificationCode;
    } else {
      throw new Error(error);
    }
  }
}

export async function getVerificationCodeRequest({
  taskID,
}: TGetVerificationCode) {
  const verificationCode = makeRequest({ taskID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
  return verificationCode;
}
