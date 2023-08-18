import { ethers } from "hardhat";
import {
  abi as tasksManagerAbi,
  address as tasksManagerAddress,
} from "../TasksManagerMumbai.json";
import {
  abi as auctionsManagerAbi,
  address as auctionsManagerAddress,
} from "../AuctionsManagerMumbai.json";
import {
  getPerformanceRequest,
  activateTaskRequest,
  sendResultsRequest,
  bidAuctionRequest,
} from "./sc_scripts/mumbai";
import { addResultsToIpfs } from "./compute_scripts";
import { computeTaskMumbai } from "./computeTaskMumbai";
import { calculateScore } from "./calculateScore";

export async function providerMumbai() {
  const providerAddress = process.env.PROVIDER_ADDRESS;
  const price = 30;
  let taskID: string;

  const tasksManager = new ethers.Contract(
    tasksManagerAddress,
    tasksManagerAbi,
    ethers.provider.getSigner()
  );

  const auctionsManager = new ethers.Contract(
    auctionsManagerAddress,
    auctionsManagerAbi,
    ethers.provider.getSigner()
  );

  console.log(`Running provider's app: mumbai testnet...`);
  console.log("----------------------------------------------------");

  auctionsManager.on("AuctionCreated", async (scAuctionID) => {
    console.log(`[AuctionsManager] Auction created by client!`);
    console.log("----------------------------------------------------");
    await bidAuctionRequest({ auctionID: scAuctionID, price });
  });

  auctionsManager.on("AuctionCancelled", (scAuctionID) => {
    //add check for my auctions
    console.log(`[AuctionsManager] Auction cancelled by client!`);
    console.log("----------------------------------------------------");
  });

  auctionsManager.on("BidPlaced", async (scAuctionID, _, scPrice) => {
    console.log(
      `[AuctionsManager] BidPlaced successfully! AuctionID: ${scAuctionID}, Price: ${scPrice}`
    );
    console.log("----------------------------------------------------");
  });

  auctionsManager.on("AuctionFinalized", (scAuctionID, provider) => {
    //add check for my auctions
    if (provider === providerAddress) {
      console.log(
        `[AuctionsManager] Auction finalized by client! AuctionID: ${scAuctionID}`
      );
      console.log("----------------------------------------------------");
    }
  });

  auctionsManager.on("TaskIDCreated", (scAuctionID, scTaskID) => {
    //add check for my auctions
    taskID = scTaskID.toString();
    console.log(`[AuctionsManager] TaskID Created! TaskID: ${scTaskID}`);
    console.log("----------------------------------------------------");
  });

  tasksManager.on("TaskCreated", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task created by auction!`);
      console.log("----------------------------------------------------");
      await activateTaskRequest({ taskID, price });
    }
  });
  tasksManager.on("TaskCancelled", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task cancelled by client!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskInvalidated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task invalidated by client!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskActivated", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task activated successfully!`);
      console.log("----------------------------------------------------");
      console.log(`[TasksManager] Computing task...`);
      await computeTaskMumbai({ taskID });
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCompletedSuccessfully", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(
        `[TasksManager] Task completed successfully! Waiting to send results...`
      );
      console.log("----------------------------------------------------");
      const resultsCID = await addResultsToIpfs({ taskID });
      if (resultsCID) {
        console.log(
          `[TasksManager] Results added to IPFS, with CID: ${resultsCID}`
        );
        await sendResultsRequest({ taskID, resultsCID });
      }
    }
  });

  tasksManager.on("TaskCompletedUnsuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task completed unsuccessfully!`);
      console.log("----------------------------------------------------");
    }
  });

  tasksManager.on("TaskReceivedResultsSuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Results received successfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskReceivedResultsUnsuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Results received unsuccessfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderUpvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID && provider === providerAddress) {
      console.log(`[TasksManager] Congratulations! You've been upvoted!`);
      console.log("----------------------------------------------------");
      const performance = await getPerformanceRequest(provider);
      console.log(`[TasksManager] Your performance is: ${performance}`);
      console.log("----------------------------------------------------");
      const score = calculateScore(
        performance.upVotes.toNumber(),
        performance.downVotes.toNumber()
      );
      console.log(`[TasksManager] Your score is: ${score}`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("ProviderDownvoted", async (provider, scTaskID) => {
    if (scTaskID.toString() === taskID && provider === providerAddress) {
      console.log(`[TasksManager] Oops! You've been downvoted!`);
      console.log("----------------------------------------------------");
      const performance = await getPerformanceRequest(provider);
      console.log(`[TasksManager] Your performance is: ${performance}`);
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

// providerMumbai().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
