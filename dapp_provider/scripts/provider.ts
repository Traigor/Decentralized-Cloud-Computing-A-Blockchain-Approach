import { ethers } from "hardhat";
import { abi, address } from "../TasksManager.json";
import {
  getPerformanceRequest,
  activateTaskRequest,
  receiveResultsRequest,
  staller,
} from "./sc_scripts";
import { computeTask } from "./computeTask";

async function provider() {
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff"; //add script to take all parameters from auction contract with event

  const providerAddress = process.env.PROVIDER_ADDRESS;
  const price = 30;

  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  console.log(`Running provider's app...`);
  console.log("----------------------------------------------------");

  tasksManager.on("TaskCreated", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task created by client!`);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      await staller(retryAfter);
      await activateTaskRequest({ taskID, price });
    }
  });
  tasksManager.on("TaskCancelled", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task cancelled by client!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskInvalidated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task invalidated by client!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskActivated", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task activated successfully!`);
      console.log("----------------------------------------------------");
      console.log(`Computing task...`);
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      await staller(retryAfter);
      await computeTask({ taskID });
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCompletedSuccessfully", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task completed successfully! Waiting to receive results...`);
      console.log("----------------------------------------------------");
      //add to ipfs and get cid
      //send results to smart contract
      const resultsCID = "testCID";
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      await staller(retryAfter);
      await receiveResultsRequest({ taskID, resultsCID });
    }
  });

  tasksManager.on("TaskCompletedUnsuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task completed unsuccessfully!`);
      console.log("----------------------------------------------------");
    }
  });

  tasksManager.on("TaskReceivedResults", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Results received successfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderUpvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Congratulations! You've been upvoted!`);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      await staller(retryAfter);
      const performance = await getPerformanceRequest(provider);
      console.log(`Your performance is: ${performance}`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderDownvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Oops! You've been downvoted!`);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      await staller(retryAfter);
      const performance = await getPerformanceRequest(provider);
      console.log(`Your performance is: ${performance}`);
      console.log("----------------------------------------------------");
    }
  });
}

provider().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
