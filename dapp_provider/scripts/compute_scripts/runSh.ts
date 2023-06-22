import { spawn } from "child_process";
type TRunSh = {
  taskID: string;
};

export async function runSh({ taskID }: TRunSh) {
  const ipfsCommand = spawn(`./Task_${taskID}/Java/ipfs.sh`);
  ipfsCommand.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  ipfsCommand.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  ipfsCommand.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      console.log("----------------------------------------------------");
      return;
    }
    return;
  });

  ipfsCommand.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });

  const computeCommand = spawn(`./Task_${taskID}/computeTask.sh`);
  computeCommand.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  computeCommand.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  computeCommand.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      console.log("----------------------------------------------------");
      return;
    }
    return;
  });

  computeCommand.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });
}
