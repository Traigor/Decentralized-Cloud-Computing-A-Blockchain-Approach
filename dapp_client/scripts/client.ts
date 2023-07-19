import { clientSepolia } from "./clientSepolia";
import { clientMumbai } from "./clientMumbai";
import { hardhatArguments } from "hardhat";

async function client() {
  switch (hardhatArguments.network) {
    case "sepolia":
      await clientSepolia();
      break;
    case "mumbai":
      await clientMumbai();
      break;
    default:
      console.log("Please provide a valid network name");
  }
}

client().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
