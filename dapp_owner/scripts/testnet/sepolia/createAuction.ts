import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../../../deployments/sepolia/AuctionsManager.json";
export async function createAuction(auctionID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    client
  );

  const auctionDeadline = 600;
  const taskDeadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";

  const ipfs = "test";

  await auctionsManager.createAuction(
    auctionID,
    auctionDeadline,
    taskDeadline,
    clientVerification,
    ipfs
  );

  const auctionState = await auctionsManager.getAuctionState(auctionID);
  console.log("----------------------------------------------------");
  console.log(
    `Auction created!\n Address: ${auctionsManager.address}\n Auction ID: ${auctionID}\n Client: ${client.address}\n State: ${auctionState} \n`
  );
  console.log("----------------------------------------------------");

  return auctionsManager.address;
}
