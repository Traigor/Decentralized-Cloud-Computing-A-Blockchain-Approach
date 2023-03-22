import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const deployTask: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  // const { deployer, client, provider } = await getNamedAccounts(); //it is for manually setting the accounts
  const [deployer, client, provider] = await ethers.getSigners();

  const args: any[] = [
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff",
    client.address,
    provider.address,
    30,
    ethers.utils.parseEther("0.0000000000000005"),
    600,
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", //to fix this, make it automatically get the address of the registry
  ];
  const task = await deploy("Task", {
    from: deployer.address,
    args: args,
    log: true,
  });

  log("----------------------------------------------------");
  log(`Task deployed to: ${task.address} with deployer: ${deployer.address}`);
  log("----------------------------------------------------");
};

export default deployTask;
deployTask.tags = ["all", "task"];
