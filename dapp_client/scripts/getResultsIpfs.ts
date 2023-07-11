import { spawn } from "child_process";
import fs from "fs";

type TGetResultsFromIpfs = {
  taskID: string;
  cid: string;
};

export async function getResultsFromIpfs({ taskID, cid }: TGetResultsFromIpfs) {
  return new Promise<void>((resolve, reject) => {
    const ipfsCommand = spawn("ipfs", [`cat`, `${cid}`]);

    ipfsCommand.stdout.on("data", (data) => {
      fs.writeFileSync(`${taskID}.txt`, data.toString());
      resolve();
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
