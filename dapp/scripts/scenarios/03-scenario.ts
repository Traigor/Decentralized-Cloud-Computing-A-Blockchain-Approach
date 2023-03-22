import { createTask, cancelTask } from "../index";

//scenario of a cancelled task
export async function cancel() {
  const address = await createTask();
  await cancelTask(address);
}

// cancel().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
