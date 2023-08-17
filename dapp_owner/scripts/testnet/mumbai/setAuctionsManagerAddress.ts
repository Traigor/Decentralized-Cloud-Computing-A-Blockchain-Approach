import { ethers } from "hardhat";
import { address as auctionsAddress } from "../../../deployments/mumbai/AuctionsManager.json";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../../../deployments/mumbai/TasksManager.json";
export async function setAuctionsManagerAddress() {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, deployer);
  await tasksManager.setAuctionsManager(auctionsAddress);
}
