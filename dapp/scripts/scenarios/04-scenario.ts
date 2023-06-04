import { createTask, activateTask, invalidateTask } from "../index";

//scenario of an invalidated task
export async function invalidate() {
  const taskID =
    "0xddd50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const address = await createTask(taskID);
  await activateTask(address, taskID);
  await invalidateTask(address, taskID);
}

// invalidate().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
