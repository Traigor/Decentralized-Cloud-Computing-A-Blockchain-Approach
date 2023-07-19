import { ethers } from "hardhat";
import { abi, address } from "../TasksManagerSepolia.json";
import {
  createTaskRequest,
  completePaymentRequest,
  getResultsRequest,
} from "./sc_scripts/sepolia";
import { getResultsFromIpfs } from "./getResultsIpfs";
import {
  addComputationCodeToIpfs,
  addVerificationCodeToIpfs,
} from "./addToIpfs";

export async function clientSepolia() {
  const providerAddress = "0xB3b0E9E018bA957e29d6C883A84412972C6A7366";
  const price = 10;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff"; //add script to take all parameters from auction contract with event

  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  console.log(`Running client's app: sepolia testnet...`);
  console.log("----------------------------------------------------");

  const computationCode = await addComputationCodeToIpfs();
  console.log(`Computation code added to IPFS with CID: ${computationCode}`);

  const verificationCode = await addVerificationCodeToIpfs();
  console.log(`Verification code added to IPFS with CID: ${verificationCode}`);

  console.log("----------------------------------------------------");

  await createTaskRequest({
    providerAddress,
    price,
    deadline,
    clientVerification,
    taskID,
    computationCode,
    verificationCode,
  });
  tasksManager.on("TaskCreated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task created successfully!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCancelled", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task cancelled!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskInvalidated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task invalidated!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskActivated", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task activated by provider!`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("TaskCompletedSuccessfully", (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Task completed successfully! Waiting to receive results...`);
      console.log("----------------------------------------------------");
    }
  });
  tasksManager.on("PaymentPending", async (scTaskID, payment) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Results Received! Payment pending: ${payment}...`);
      console.log("----------------------------------------------------");
      await completePaymentRequest({ taskID, payment });
    }
  });
  tasksManager.on("PaymentCompleted", async (scTaskID) => {
    if (scTaskID.toString() === taskID) {
      console.log(`Payment completed successfully!`);
      console.log("----------------------------------------------------");
      const results = await getResultsRequest({ taskID });
      if (results) {
        console.log(`Results cid: ${results}`);
        await getResultsFromIpfs({ taskID, cid: results });
        console.log(`Results saved to file: ${taskID}.txt`);
        console.log("----------------------------------------------------");
      }
    }
  });
}

// clientSepolia().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
