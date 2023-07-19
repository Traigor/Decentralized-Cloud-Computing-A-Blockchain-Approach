import {
  createDockerfileAndShSepolia,
  chmod,
  runSh,
  createJavaFileSepolia,
} from "./compute_scripts";

type TComputeTask = {
  taskID: string;
};
const PRIVATE_KEY = process.env.PRIVATE_KEY;
export async function computeTaskSepolia({ taskID }: TComputeTask) {
  await createDockerfileAndShSepolia({ taskID, privateKey: PRIVATE_KEY });
  await createJavaFileSepolia({ taskID });
  await chmod({ taskID });
  await runSh({ taskID });
}
