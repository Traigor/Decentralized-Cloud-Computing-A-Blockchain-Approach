import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const deployTask: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  // const { deployer, client, provider } = await getNamedAccounts(); //it is for manually setting the accounts
  const [deployer] = await ethers.getSigners();

  const auction = await deploy("AuctionsManager", {
    from: deployer.address,
    log: true,
  });

  log("----------------------------------------------------");
  log(
    `AuctionsManager deployed to: ${auction.address} with deployer: ${deployer.address}`
  );
  log("----------------------------------------------------");
};

export default deployTask;
deployTask.tags = ["all", "auctionsManager"];
