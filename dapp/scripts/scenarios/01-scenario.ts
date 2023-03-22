import {
  createTask,
  completeTaskSuccessfully,
  activateTask,
  completePayment,
} from "../index";

//scenario of a completed successful task
export async function completedSuccessfully() {
  const address = await createTask();
  await activateTask(address);
  const payment = await completeTaskSuccessfully(address);
  await completePayment(address, payment);
}

// completedSuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
