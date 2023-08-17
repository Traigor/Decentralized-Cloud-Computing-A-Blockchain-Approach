import { ethers } from "hardhat";
import { abi, address } from "../../../AuctionsManagerSepolia.json";

import { calculateScore } from "../../calculateScore";
import { staller } from "../staller";

type TFinalizeAuction = {
  auctionID: string;
  provider: string;
};

const maxRetries = 5;
let retries = 0;
export async function finalizeAuction({
  auctionID,
  provider,
}: TFinalizeAuction) {
  const auctionsManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const wei = 1000000000000000000;
  const bids = await auctionsManager.getAuctionBids(auctionID);
  let score = 0;
  let winnerBid;
  for (const bid of bids) {
    const bidScore = calculateScore(
      bid.providerUpVotes.toNumber(),
      bid.providerDownVotes.toNumber()
    );
    //choose based on best score only
    if (bidScore >= score) {
      score = bidScore;
      winnerBid = bid;
    }
  }
  const price = winnerBid.bid.toNumber();
  const clientCollateral = price * 2;
  const value = ethers.utils.parseEther(
    (clientCollateral / wei).toFixed(18).toString()
  );

  await auctionsManager.finalize(auctionID, provider, {
    value: value,
  });
}

async function makeRequest({ auctionID, provider }: TFinalizeAuction) {
  try {
    await finalizeAuction({ auctionID, provider });
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
      await makeRequest({ auctionID, provider });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      // const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      // retries++;
      // console.log(`Retrying after ${retryAfter} ms...`);
      // await staller(retryAfter);
      // await makeRequest({ auctionID, provider });
    } else {
      throw new Error(error);
    }
  }
}

export async function finalizeAuctionRequest({
  auctionID,
  provider,
}: TFinalizeAuction) {
  makeRequest({ auctionID, provider }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
