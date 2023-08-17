import { ethers } from "hardhat";
import {
  abi,
  address,
} from "../../../deployments/sepolia/AuctionsManager.json";
import { staller } from "../../staller";

const maxRetries = 5;
let retries = 0;
const auctionID = process.env.AUCTION_ID;

export async function deleteAuctions() {
  const auctionsManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await auctionsManager.deleteTasks();

  console.log("----------------------------------------------------");
  console.log(`Auctions Deleted`);
  console.log("----------------------------------------------------");
}

async function makeRequest() {
  try {
    await deleteAuctions();
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
