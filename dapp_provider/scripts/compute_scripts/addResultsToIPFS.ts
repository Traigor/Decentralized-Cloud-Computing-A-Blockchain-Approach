import { spawn } from "child_process";

type TAddToIpfs = {
  taskID: string;
};

export async function addResultsToIpfs({ taskID }: TAddToIpfs) {
  return new Promise<string>((resolve, reject) => {
    const ipfsCommand = spawn("ipfs", [
      "add",
      `.Task_${taskID}/output/${taskID}.txt`,
    ]);

    ipfsCommand.stdout.on("data", (data) => {
      const cid = data.toString().split(" ")[1];
      resolve(cid);
    });

    ipfsCommand.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    ipfsCommand.on("close", (code) => {
      if (code === 0) {
        console.log("----------------------------------------------------");
      }
      // Reject the promise if there's an error
      else {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });

    ipfsCommand.on("error", (err) => {
      // Reject the promise with the error
      reject(err);
    });
  });
}
