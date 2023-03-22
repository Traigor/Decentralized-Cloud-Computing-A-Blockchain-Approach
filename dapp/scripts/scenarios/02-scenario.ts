import { createTask, completeTaskUnsuccessfully, activateTask } from "../index";

//scenario of a completed unsuccessful task
export async function completedUnsuccessfully() {
  const address = await createTask();
  await activateTask(address);
  await completeTaskUnsuccessfully(address);
}

// completedUnsuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
