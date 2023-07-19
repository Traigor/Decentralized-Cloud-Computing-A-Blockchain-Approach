import { ethers } from "hardhat";
import { abi, address } from "../TasksManagerSepolia.json";
import {
  getPerformanceRequest,
  activateTaskRequest,
  sendResultsRequest,
} from "./sc_scripts/sepolia";
import { addResultsToIpfs } from "./compute_scripts";
import { computeTaskSepolia } from "./computeTaskSepolia";
import { calculateScore } from "./calculateScore";

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

  console.log(`Running provider's app: sepolia testnet...`);
  console.log("----------------------------------------------------");

  tasksManager.on("TaskCreated", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task created by client!`);
      console.log("----------------------------------------------------");
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
      await computeTaskSepolia({ taskID });
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCompletedSuccessfully", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task completed successfully! Waiting to send results...`);
      console.log("----------------------------------------------------");
      const resultsCID = await addResultsToIpfs({ taskID });
      if (resultsCID) {
        console.log(`Results added to IPFS, with CID: ${resultsCID}`);
        await sendResultsRequest({ taskID, resultsCID });
      }
    }
  });

  tasksManager.on("TaskCompletedUnsuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task completed unsuccessfully!`);
      console.log("----------------------------------------------------");
    }
  });

  tasksManager.on("TaskReceivedResultsSuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Results received successfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskReceivedResultsUnsuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Results received unsuccessfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderUpvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID && provider === providerAddress) {
      console.log(`Congratulations! You've been upvoted!`);
      console.log("----------------------------------------------------");
      const performance = await getPerformanceRequest(provider);
      console.log(`Your performance is: ${performance}`);
      console.log("----------------------------------------------------");
      const score = calculateScore(
        performance.upVotes.toNumber(),
        performance.downVotes.toNumber()
      );
      console.log(`Your score is: ${score}`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderDownvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID && provider === providerAddress) {
      console.log(`Oops! You've been downvoted!`);
      console.log("----------------------------------------------------");
      const performance = await getPerformanceRequest(provider);
      console.log(`Your performance is: ${performance}`);
      console.log("----------------------------------------------------");
      const score = calculateScore(
        performance.upVotes.toNumber(),
        performance.downVotes.toNumber()
      );
      console.log(`Your score is: ${score}`);
      console.log("----------------------------------------------------");
    }
  });
}

provider().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
