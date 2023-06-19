import { ethers } from "hardhat";
import { abi, address } from "../../TasksManager.json";
import { staller } from "./staller";

const maxRetries = 5;
let retries = 0;
// const payment = 580;
const payment = 40;
type TCompletePayment = {
  taskID: string;
  payment: number;
};
async function completePayment({ payment, taskID }: TCompletePayment) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const wei = 1000000000000000000;

  const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());
  await tasksManager.completePayment(taskID, {
    value: value,
  });
}

async function makeRequest({ payment, taskID }: TCompletePayment) {
  try {
    await completePayment({ payment, taskID });
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
      await makeRequest({ payment, taskID });
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      await makeRequest({ payment, taskID });
    } else {
      throw new Error(error);
    }
  }
}

export async function completePaymentRequest({
  payment,
  taskID,
}: TCompletePayment) {
  makeRequest({ payment, taskID }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
