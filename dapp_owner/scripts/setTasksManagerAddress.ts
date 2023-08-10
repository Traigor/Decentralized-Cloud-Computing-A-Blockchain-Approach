import { ethers } from "hardhat";
import {
  abi as auctionsAbi,
  address as auctionsAddress,
} from "../deployments/localhost/AuctionsManager.json";
import { address as tasksAddress } from "../deployments/localhost/TasksManager.json";
export async function setTasksManagerAddress() {
  const [deployer, client, provider] = await ethers.getSigners();
  const auctionsManager = new ethers.Contract(
    auctionsAddress,
    auctionsAbi,
    deployer
  );
  await auctionsManager.setTasksManager(tasksAddress);
}
