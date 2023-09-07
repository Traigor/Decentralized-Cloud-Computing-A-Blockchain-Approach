import { ethers } from "hardhat";
import {
  abi as tasksManagerAbi,
  address as tasksManagerAddress,
} from "../TasksManagerSepolia.json";
import {
  abi as auctionsManagerAbi,
  address as auctionsManagerAddress,
} from "../AuctionsManagerSepolia.json";
import {
  getPerformanceRequest,
  activateTaskRequest,
  sendResultsRequest,
  bidAuctionRequest,
} from "./sc_scripts/sepolia";
import { addResultsToIpfs } from "./compute_scripts";
import { computeTaskSepolia } from "./computeTaskSepolia";
import { calculateScore } from "./calculateScore";

export async function providerSepolia() {
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

  console.log(`Running provider's app: sepolia testnet...`);
  console.log("----------------------------------------------------");

  auctionsManager.on("AuctionCreated", async (scAuctionID, client) => {
    console.log(
      `[AuctionsManager] Auction created by client!\n AuctionID: ${scAuctionID}\n Client: ${client}`
    );
    console.log("----------------------------------------------------");
    // await bidAuctionRequest({ auctionID: scAuctionID, price });
  });

  auctionsManager.on("AuctionCancelled", (scAuctionID, client) => {
    //add check for my auctions
    console.log(
      `[AuctionsManager] Auction cancelled by client!\n AuctionID: ${scAuctionID}\n Client: ${client}`
    );
    console.log("----------------------------------------------------");
  });

  auctionsManager.on("BidPlaced", async (scAuctionID, provider, scPrice) => {
    if (provider === providerAddress) {
      console.log(
        `[AuctionsManager] BidPlaced successfully!\n AuctionID: ${scAuctionID}\n Price: ${scPrice}`
      );
      console.log("----------------------------------------------------");
    }
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

  auctionsManager.on(
    "TaskIDCreated",
    (scAuctionID, scTaskID, client, provider) => {
      if (provider === providerAddress) {
        //add check for my auctions
        taskID = scTaskID.toString();
        console.log(
          `[AuctionsManager] TaskID Created!\n AuctionID: ${scAuctionID}\n TaskID: ${scTaskID}\n Client: ${client}`
        );
        console.log("----------------------------------------------------");
      }
    }
  );

  tasksManager.on("TaskCreated", async (scTaskID, client, provider) => {
    if (provider === providerAddress) {
      console.log(
        `[TasksManager] Task created by auction!\n TaskID: ${scTaskID}\n Client: ${client}`
      );
      console.log("----------------------------------------------------");
      // await activateTaskRequest({ taskID, price });
    }
  });
  tasksManager.on("TaskCancelled", (scTaskID, client, provider) => {
    if (provider === providerAddress) {
      console.log(
        `[TasksManager] Task cancelled by client!\n TaskID: ${scTaskID}\n Client: ${client}`
      );
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskInvalidated", (scTaskID, client, provider) => {
    if (provider === providerAddress) {
      console.log(
        `[TasksManager] Task invalidated by client!\n TaskID: ${scTaskID}\n Client: ${client}`
      );
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskActivated", async (scTaskID, client, provider) => {
    if (provider === providerAddress) {
      console.log(
        `[TasksManager] Task activated successfully!\n TaskID: ${scTaskID}\n Client: ${client}`
      );
      console.log("----------------------------------------------------");
      console.log(`[TasksManager] Computing task...`);
      await computeTaskSepolia({ taskID: scTaskID });
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on(
    "TaskCompletedSuccessfully",
    async (scTaskID, client, provider) => {
      if (provider === providerAddress) {
        console.log(
          `[TasksManager] Task completed successfully! Waiting to send results...\n TaskID: ${scTaskID}\n Client: ${client}`
        );
        console.log("----------------------------------------------------");
        const resultsCID = await addResultsToIpfs({ taskID: scTaskID });
        if (resultsCID) {
          console.log(
            `[TasksManager] Results added to IPFS, with CID: ${resultsCID}`
          );
          await sendResultsRequest({ taskID: scTaskID, resultsCID });
        }
      }
    }
  );

  tasksManager.on(
    "TaskCompletedUnsuccessfully",
    (scTaskID, client, provider) => {
      if (provider === providerAddress) {
        console.log(
          `[TasksManager] Task completed unsuccessfully!\n TaskID: ${scTaskID}\n Client: ${client}`
        );
        console.log("----------------------------------------------------");
      }
    }
  );

  tasksManager.on(
    "TaskReceivedResultsSuccessfully",
    (scTaskID, client, provider) => {
      if (provider === providerAddress) {
        console.log(
          `[TasksManager] Results received successfully!\n TaskID: ${scTaskID}\n Client: ${client}`
        );
        console.log("----------------------------------------------------");
      }
    }
  );
  tasksManager.on(
    "TaskReceivedResultsUnsuccessfully",
    (scTaskID, client, provider) => {
      if (provider === providerAddress) {
        console.log(
          `[TasksManager] Results received unsuccessfully!\n TaskID: ${scTaskID}\n Client: ${client}`
        );
        console.log("----------------------------------------------------");
      }
    }
  );
  tasksManager.on("ProviderUpvoted", async (provider, scTaskID) => {
    if (provider === providerAddress) {
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
    if (provider === providerAddress) {
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

// providerSepolia().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
