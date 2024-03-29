import { completedSuccessfully } from "./01-scenario";
import { completedUnsuccessfully } from "./02-scenario";
import { cancel } from "./03-scenario";
import { invalidate } from "./04-scenario";
import {
  getPerformance,
  deployTasksManager,
  deployAuctionsManager,
  deleteTasks,
} from "../index";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xaddress";
const PROVIDER_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

export async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying smart contract");
  await deployTasksManager();
  await deployAuctionsManager();
  console.log("----------------------------------------------------");
  console.log("Running scenario 1: Task completed successfully");
  await completedSuccessfully();
  console.log("----------------------------------------------------");
  console.log("Running scenario 2: Task completed unsuccessfully");
  await completedUnsuccessfully();
  console.log("----------------------------------------------------");
  console.log("Running scenario 3: Task cancelled");
  await cancel();
  console.log("----------------------------------------------------");
  console.log("Running scenario 4: Task invalidated");
  await invalidate();
  console.log("----------------------------------------------------");
  await getPerformance();
  console.log("----------------------------------------------------");
  console.log("All scenarios completed successfully");
  console.log("----------------------------------------------------");
  await deleteTasks();
  return true;
}

// commented out to avoid running the script when running tests for gas estimation
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
