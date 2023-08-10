import { ethers } from "hardhat";
import { address } from "../../../deployments/mumbai/AuctionsManager.json";

export default async function listen() {
  const auctionsManagerContract = await ethers.getContract("AuctionsManager");
  const auctionsManager = await auctionsManagerContract.attach(address);
  console.log(`Listening on events of AuctionsManager contract... ${address}`);

  auctionsManager.on("AuctionCreated", (auctionID) => {
    console.log(`[AuctionCreated] Auction ID: ${auctionID}`);
  });
  auctionsManager.on("AuctionCancelled", (auctionID) => {
    console.log(`[AuctionCancelled] Auction ID: ${auctionID}`);
  });
  auctionsManager.on("AuctionFinalized", (auctionID) => {
    console.log(`[AuctionFinalized] Auction ID: ${auctionID}`);
  });
  auctionsManager.on("AuctionDeleted", (auctionID) => {
    console.log(`[AuctionDeleted] Auction ID: ${auctionID}`);
  });
  auctionsManager.on("BidPlaced", (auctionID, provider, bid) => {
    console.log(
      `[BidPlaced]  Auction ID: ${auctionID} Provider: ${provider} Bid: ${bid}`
    );
  });
}

listen();
