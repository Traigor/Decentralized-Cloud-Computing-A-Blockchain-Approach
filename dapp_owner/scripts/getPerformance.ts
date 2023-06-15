import { ethers } from "hardhat";

export async function getPerformance(address: string, provider: string) {
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = await tasksManagerContract.attach(address);
  const performance = await tasksManager.getPerformance(provider);

  console.log("----------------------------------------------------");
  console.log(
    `Provider performance:\n Provider: ${provider}\n Performance: ${performance}`
  );
  console.log("----------------------------------------------------");
}

// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xaddress";
// const PROVIDER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
// getPerformance(CONTRACT_ADDRESS, PROVIDER_ADDRESS);
