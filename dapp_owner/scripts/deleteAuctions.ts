import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../deployments/localhost/AuctionsManager.json";
export async function deleteTasks() {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    deployer
  );
  const previousActiveAuctions = await auctionsManager.getActiveAuctions();
  await ethers.provider.send("evm_increaseTime", [240]);
  (await auctionsManager.deleteAuctions()).wait();
  const currentActiveAuctions = await auctionsManager.getActiveAuctions();
  console.log("----------------------------------------------------");
  console.log(
    `Auctions deleted!\n Previous active tasks: ${previousActiveAuctions}\n Current active tasks: ${currentActiveAuctions}`
  );
  console.log("----------------------------------------------------");
}
