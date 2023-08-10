import {
  createTask,
  cancelTask,
  setAuctionsManagerAddress,
  setTasksManagerAddress,
  createAuction,
  bid,
  finalize,
} from "../index";

//scenario of a cancelled task
export async function cancel() {
  const auctionID =
    "0xccc50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  await setAuctionsManagerAddress();
  await setTasksManagerAddress();
  await createAuction(auctionID);
  await bid(auctionID);
  const taskID = await finalize(auctionID);
  await cancelTask(taskID);
}

// cancel().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
