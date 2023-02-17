import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployTask: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const args: any[] = [
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff",
    "0xC3DFE1646524c6F3303C647Cc3B7Ef90967feFC9",
    "0x9F1a751994D1709D8A1e8d3a2d0223eB00B30391",
    30,
    500,
    600,
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ];
  const task = await deploy("Task", {
    from: deployer,
    args: args,
    log: true,
  });

  log("----------------------------------------------------");
  log(`Task deployed to: ${task.address} with deployer: ${deployer}`);
};

export default deployTask;
deployTask.tags = ["all", "task"];
