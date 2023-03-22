import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployRegistry: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const registry = await deploy("Registry", {
    from: deployer,
    log: true,
  });

  log("----------------------------------------------------");
  log(`Registry deployed to: ${registry.address} with deployer: ${deployer}`);
};

export default deployRegistry;
deployRegistry.tags = ["all", "registry"];
