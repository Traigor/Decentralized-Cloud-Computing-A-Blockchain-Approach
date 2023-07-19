import { ethers } from "hardhat";
import { abi, address } from "../../../deployments/mumbai/TasksManager.json";
import { staller } from "../../staller";

const maxRetries = 10;
let retries = 0;
// const payment = 580;
const payment = 40;
const taskID = process.env.TASK_ID;

export async function completePayment(payment: number) {
  // const tasksManager = await ethers.getContract("TasksManager");
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

  console.log("----------------------------------------------------");
  console.log(`Payment completed!`);
  console.log("----------------------------------------------------");
}

async function makeRequest() {
  try {
    await completePayment(payment);
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
      await makeRequest();
    } else if (error.reason) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
    } else {
      throw new Error(error);
    }
  }
}
makeRequest().catch((error) => {
  if (!error._isProviderError) console.error(error);
});
