import { spawn } from "child_process";
type TChmod = {
  taskID: string;
};

export async function chmod({ taskID }: TChmod) {
  const command = spawn("chmod", ["-R", "777", `Task_${taskID}`]);
  command.stdout.on("data", (data) => {
    // console.log(`stdout: ${data}`);
  });

  command.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  command.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    if (code === 0) {
      return;
    }
    return;
  });

  command.on("error", () => {
    // console.log(`child process exited with code ${code}`);
    return;
  });
}
