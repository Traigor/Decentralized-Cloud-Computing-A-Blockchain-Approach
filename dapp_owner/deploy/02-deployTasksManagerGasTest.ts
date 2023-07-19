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

  const task = await deploy("TasksManagerGasTest", {
    from: deployer.address,
    log: true,
  });

  log("----------------------------------------------------");
  log(
    `TasksManagerGasTest deployed to: ${task.address} with deployer: ${deployer.address}`
  );
  log("----------------------------------------------------");
};

export default deployTask;
deployTask.tags = ["all", "tasksManagerGasTest"];
