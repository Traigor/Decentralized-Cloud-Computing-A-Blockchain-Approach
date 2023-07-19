import {
  createDockerfileAndShMumbai,
  chmod,
  runSh,
  createJavaFileMumbai,
} from "./compute_scripts";

type TComputeTask = {
  taskID: string;
};
const PRIVATE_KEY = process.env.PRIVATE_KEY;
export async function computeTaskMumbai({ taskID }: TComputeTask) {
  await createDockerfileAndShMumbai({ taskID, privateKey: PRIVATE_KEY });
  await createJavaFileMumbai({ taskID });
  await chmod({ taskID });
  await runSh({ taskID });
}
