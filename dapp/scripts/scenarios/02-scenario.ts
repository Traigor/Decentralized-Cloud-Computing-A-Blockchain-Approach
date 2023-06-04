import { createTask, completeTaskUnsuccessfully, activateTask } from "../index";

//scenario of a completed unsuccessful task
export async function completedUnsuccessfully() {
  const taskID =
    "0xbbb50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const address = await createTask(taskID);
  await activateTask(address, taskID);
  await completeTaskUnsuccessfully(address, taskID);
}

// completedUnsuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
