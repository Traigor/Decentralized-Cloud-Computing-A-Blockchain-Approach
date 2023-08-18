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
  completePaymentRequest,
  getResultsRequest,
  createAuctionRequest,
  finalizeAuctionRequest,
} from "./sc_scripts/mumbai";
import { getResultsFromIpfs } from "./getResultsIpfs";
import { addCodeToIpfs } from "./addToIpfs";

export async function clientMumbai() {
  const auctionDeadline = 600;
  const taskDeadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
  const auctionID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";

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

  console.log(`Running client's app: mumbai testnet...`);
  console.log("----------------------------------------------------");

  const code = await addCodeToIpfs();
  console.log(`Code added to IPFS with CID: ${code}`);

  console.log("----------------------------------------------------");

  await createAuctionRequest({
    auctionID,
    auctionDeadline,
    taskDeadline,
    clientVerification,
    code,
  });

  auctionsManager.on("AuctionCreated", (scAuctionID) => {
    if (scAuctionID.toString() === auctionID) {
      console.log(`[AuctionsManager] Auction created successfully!`);
      console.log("----------------------------------------------------");
    }
  });

  auctionsManager.on("AuctionCancelled", (scAuctionID) => {
    if (scAuctionID.toString() === auctionID) {
      console.log(`[AuctionsManager] Auction cancelled successfully!`);
      console.log("----------------------------------------------------");
    }
  });

  auctionsManager.on("BidPlaced", async (scAuctionID, provider, price) => {
    if (scAuctionID.toString() === auctionID) {
      console.log(
        `[AuctionsManager] Bid placed by provider! Provider: ${provider}, Price: ${price}`
      );
      console.log("----------------------------------------------------");
      //for test purposes we bid only once and then finalize
      await finalizeAuctionRequest({ auctionID, provider });
    }
  });

  auctionsManager.on("AuctionFinalized", (scAuctionID, provider) => {
    if (scAuctionID.toString() === auctionID) {
      console.log(
        `[AuctionsManager] Auction finalized successfully! AuctionID:${scAuctionID} Provider: ${provider}`
      );
      console.log("----------------------------------------------------");
    }
  });

  auctionsManager.on("TaskIDCreated", (scAuctionID, scTaskID) => {
    if (scAuctionID.toString() === auctionID) {
      taskID = scTaskID.toString();
      console.log(`[AuctionsManager] TaskID Created! TaskID: ${scTaskID}`);
      console.log("----------------------------------------------------");
    }
  });

  tasksManager.on("TaskCreated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task created successfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCancelled", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task cancelled!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskInvalidated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task invalidated!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskActivated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Task activated by provider!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCompletedSuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(
        `[TasksManager] Task completed successfully! Waiting to receive results...`
      );
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("PaymentPending", async (scTaskID, payment) => {
    if (scTaskID.toString() === taskID) {
      console.log(
        `[TasksManager] Results Received! Payment pending: ${payment}...`
      );
      console.log("----------------------------------------------------");
      await completePaymentRequest({ taskID, payment });
    }
  });
  tasksManager.on("PaymentCompleted", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`[TasksManager] Payment completed successfully!`);
      console.log("----------------------------------------------------");
      const results = await getResultsRequest({ taskID });
      if (results) {
        console.log(`[TasksManager] Results cid: ${results}`);
        await getResultsFromIpfs({ taskID, cid: results });
        console.log(`[TasksManager] Results saved to file: ${taskID}.txt`);
        console.log("----------------------------------------------------");
      }
    }
  });
}

// clientMumbai().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
