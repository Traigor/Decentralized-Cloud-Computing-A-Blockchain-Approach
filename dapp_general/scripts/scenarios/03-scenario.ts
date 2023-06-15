import { createTask, cancelTask } from "../index";

//scenario of a cancelled task
export async function cancel() {
  const taskID =
    "0xccc50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const address = await createTask(taskID);
  await cancelTask(address, taskID);
}

// cancel().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
