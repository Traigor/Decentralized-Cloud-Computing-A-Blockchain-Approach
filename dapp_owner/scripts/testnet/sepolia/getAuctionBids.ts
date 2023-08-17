import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../../../deployments/sepolia/AuctionsManager.json";

export async function getAuctionBids(auctionID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    provider
  );

  const bids = await auctionsManager.getAuctionBids(auctionID);

  console.log("----------------------------------------------------");
  console.log(`Auctions bids: ${bids}`);
  console.log("----------------------------------------------------");
}
