import { spawn } from "child_process";

type TChmod = {
  taskID: string;
};

export async function chmod({ taskID }: TChmod) {
  const ipfsCommand = spawn("chmod", [
    "-R",
    "777",
    `.Task_${taskID}/Java/ipfs.sh`,
  ]);
  ipfsCommand.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  ipfsCommand.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  ipfsCommand.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      return;
    }
    return;
  });

  ipfsCommand.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });

  const computeCommand = spawn("chmod", [
    "-R",
    "777",
    `.Task_${taskID}/computeTask.sh`,
  ]);
  computeCommand.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  computeCommand.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  computeCommand.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      return;
    }
    return;
  });

  computeCommand.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });
}
