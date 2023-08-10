import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../deployments/localhost/AuctionsManager.json";
export async function finalize(auctionID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    client
  );
  const wei = 1000000000000000000;
  const price = 30;
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
