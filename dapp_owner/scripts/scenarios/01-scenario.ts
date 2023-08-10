import { ethers } from "hardhat";
import {
  completeTaskSuccessfully,
  activateTask,
  completePayment,
  getResults,
  createAuction,
  bid,
  finalize,
  setAuctionsManagerAddress,
  setTasksManagerAddress,
} from "../index";
import { sendResults } from "../sendResults";

//scenario of a completed successful task
export async function completedSuccessfully() {
  const auctionID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  await setAuctionsManagerAddress();
  await setTasksManagerAddress();
  await createAuction(auctionID);
  await bid(auctionID);
  const taskID = await finalize(auctionID);
  await activateTask(taskID);
  const payment = await completeTaskSuccessfully(taskID);
  await sendResults(taskID);
  await completePayment(payment, taskID);
  await getResults(taskID);
}

// completedSuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
