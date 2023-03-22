import { createTask, activateTask, invalidateTask } from "../index";

//scenario of an invalidated task
export async function invalidate() {
  const address = await createTask();
  await activateTask(address);
  await invalidateTask(address);
}

// invalidate().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
