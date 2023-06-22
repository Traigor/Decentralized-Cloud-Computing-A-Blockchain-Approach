import {
  createDockerfileAndSh,
  chmod,
  runSh,
  createJavaFile,
} from "./compute_scripts";

type TComputeTask = {
  taskID: string;
};
const PRIVATE_KEY = process.env.PRIVATE_KEY;
export async function computeTask({ taskID }: TComputeTask) {
  await createDockerfileAndSh({ taskID, privateKey: PRIVATE_KEY });
  await createJavaFile({ taskID });
  await chmod({ taskID });
  await runSh({ taskID });
}
