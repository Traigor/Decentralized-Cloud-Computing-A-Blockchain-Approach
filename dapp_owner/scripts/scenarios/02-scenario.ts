import {
  createTask,
  completeTaskUnsuccessfully,
  activateTask,
  setAuctionsManagerAddress,
  setTasksManagerAddress,
  createAuction,
  bid,
  finalize,
} from "../index";

//scenario of a completed unsuccessful task
export async function completedUnsuccessfully() {
  const auctionID =
    "0xbbb50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  await setAuctionsManagerAddress();
  await setTasksManagerAddress();
  await createAuction(auctionID);
  await bid(auctionID);
  const taskID = await finalize(auctionID);
  await activateTask(taskID);
  await completeTaskUnsuccessfully(taskID);
}

// completedUnsuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
