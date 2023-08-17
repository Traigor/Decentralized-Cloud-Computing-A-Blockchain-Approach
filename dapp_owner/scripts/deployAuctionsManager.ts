import { ethers } from "hardhat";

export async function deployAuctionsManager() {
  const AuctionsManager = await ethers.getContractFactory("AuctionsManager");
  const auctionsManager = await AuctionsManager.deploy();

  await auctionsManager.deployed();
  console.log("AuctionsManager deployed to:", auctionsManager.address);
  return auctionsManager.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

deployAuctionsManager().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
