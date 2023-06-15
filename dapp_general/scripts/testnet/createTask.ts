import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;
const taskID = process.env.TASK_ID;

export async function createTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const providerAddress = "0xB3b0E9E018bA957e29d6C883A84412972C6A7366";
  const price = 10;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
  const wei = 1000000000000000000;
  const clientCollateral = price * 2;
  const value = ethers.utils.parseEther(
    (clientCollateral / wei).toFixed(18).toString()
  );
  await tasksManager.createTask(
    taskID,
    providerAddress,
    price,
    deadline,
    clientVerification,
    "ipfsVer",
    "ipfsComp",
    { value: value }
  );

  console.log("----------------------------------------------------");
  console.log(`Task created!`);
  console.log("----------------------------------------------------");
}

async function makeRequest() {
  try {
    await createTask();
  } catch (error) {
    if (error._isProviderError && !error.reason && retries < maxRetries) {
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      staller(retryAfter);
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
