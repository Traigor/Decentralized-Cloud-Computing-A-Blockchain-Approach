import {
  createTask,
  completeTaskSuccessfully,
  activateTask,
  completePayment,
  getResults,
} from "../index";
import { receiveResults } from "../receiveResults";

//scenario of a completed successful task
export async function completedSuccessfully() {
  const taskID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const address = await createTask(taskID);
  await activateTask(address, taskID);
  const payment = await completeTaskSuccessfully(address, taskID);
  await receiveResults(address, taskID);
  await completePayment(address, payment, taskID);
  await getResults(address, taskID);
}

// completedSuccessfully().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
