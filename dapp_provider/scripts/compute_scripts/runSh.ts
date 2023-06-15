import { spawn } from "child_process";
type TRunSh = {
  taskID: string;
};

export async function runSh({ taskID }: TRunSh) {
  const command = spawn(`./Task_${taskID}/computeTask.sh`);
  command.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  command.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  command.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      console.log("----------------------------------------------------");
      return;
    }
    return;
  });

  command.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });
}
