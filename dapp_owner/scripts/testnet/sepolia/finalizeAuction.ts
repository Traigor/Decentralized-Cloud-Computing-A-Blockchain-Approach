import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../../../deployments/sepolia/AuctionsManager.json";
import { calculateScore } from "../calculateScore";
export async function finalize(auctionID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    client
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
  const finalized = (
    await auctionsManager.finalize(auctionID, provider.address, {
      value: value,
    })
  ).wait();

  const taskID = (await finalized).events[2].args?.taskID;

  const auctionState = await auctionsManager.getAuctionState(auctionID);

  console.log("----------------------------------------------------");
  console.log(
    `Auction finalized!\n Auction ID: ${auctionID}\n State: ${auctionState}\n Task ID: ${taskID}`
  );
  console.log("----------------------------------------------------");
  return taskID;
}
