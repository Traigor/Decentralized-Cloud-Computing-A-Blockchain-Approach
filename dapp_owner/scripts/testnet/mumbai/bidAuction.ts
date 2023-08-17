import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../../../deployments/mumbai/AuctionsManager.json";

export async function bid(auctionID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    provider
  );

  const bid = 30;

  await auctionsManager.bid(auctionID, bid);

  const auctionState = await auctionsManager.getAuctionState(auctionID);

  console.log("----------------------------------------------------");
  console.log(
    `Auction bid made!\n Auction ID: ${auctionID}\n State: ${auctionState}`
  );
  console.log("----------------------------------------------------");
}
