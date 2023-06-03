import { createTask, getTask } from "../index";

export async function testGetTask() {
  const address = await createTask();
  await getTask(
    address,
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff"
  );
}

// testGetTask().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
