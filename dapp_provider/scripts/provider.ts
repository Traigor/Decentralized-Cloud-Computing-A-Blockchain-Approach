import { providerSepolia } from "./providerSepolia";
import { providerMumbai } from "./providerMumbai";
import { hardhatArguments } from "hardhat";

async function provider() {
  switch (hardhatArguments.network) {
    case "sepolia":
      await providerSepolia();
      break;
    case "mumbai":
      await providerMumbai();
      break;
    default:
      console.log("Please provide a valid network name");
  }
}

provider().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
