import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function getPerformance() {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);
  const performance = await tasksManager.getPerformance(provider.address);

  console.log("----------------------------------------------------");
  console.log(
    `Provider performance:\n Provider: ${provider.address}\n Performance: ${performance}`
  );
  console.log("----------------------------------------------------");
}

// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xaddress";
// const PROVIDER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
// getPerformance(CONTRACT_ADDRESS, PROVIDER_ADDRESS);
