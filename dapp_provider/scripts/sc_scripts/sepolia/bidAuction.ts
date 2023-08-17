import { ethers } from "hardhat";
import { abi, address } from "../../../AuctionsManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;

type TBidAuction = {
  auctionID: string;
  price: number;
};
async function bidAuction({ auctionID, price }: TBidAuction) {
  const auctionsManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await auctionsManager.bid(auctionID, price);
}

async function makeRequest({ auctionID, price }: TBidAuction) {
  try {
    await bidAuction({ auctionID, price });
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
      await makeRequest({ auctionID, price });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      await makeRequest({ auctionID, price });
    } else {
      throw new Error(error);
    }
  }
}

export async function bidAuctionRequest({ auctionID, price }: TBidAuction) {
  makeRequest({ auctionID, price }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
