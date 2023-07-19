import { ethers } from "hardhat";
import { abi, address } from "../../../TasksManagerSepolia.json";
import { staller } from "../staller";

const maxRetries = 5;
let retries = 0;
type TCreateTask = {
  taskID: string;
  providerAddress: string;
  price: number;
  deadline: number;
  clientVerification: string;
  computationCode: string;
  verificationCode: string;
};
async function createTask({
  taskID,
  providerAddress,
  price,
  deadline,
  clientVerification,
  computationCode,
  verificationCode,
}: TCreateTask) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const wei = 1000000000000000000;
  const clientCollateral = price * 2;
  const value = ethers.utils.parseEther(
    (clientCollateral / wei).toFixed(18).toString()
  );
  await tasksManager.createTask(
    taskID,
    providerAddress,
    price,
    deadline,
    clientVerification,
    verificationCode,
    computationCode,
    { value: value }
  );
}

async function makeRequest({
  taskID,
  providerAddress,
  price,
  deadline,
  clientVerification,
  computationCode,
  verificationCode,
}: TCreateTask) {
  try {
    await createTask({
      taskID,
      providerAddress,
      price,
      deadline,
      clientVerification,
      computationCode,
      verificationCode,
    });
  } catch (error) {
    if (
      (error._isProviderError || error.code === "NETWORK_ERROR") &&
      retries < maxRetries
    ) {
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      await staller(retryAfter);
      await makeRequest({
        taskID,
        providerAddress,
        price,
        deadline,
        clientVerification,
        computationCode,
        verificationCode,
      });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      retries++;
      console.log(`Retrying after ${retryAfter} ms...`);
      await staller(retryAfter);
      await makeRequest({
        taskID,
        providerAddress,
        price,
        deadline,
        clientVerification,
        computationCode,
        verificationCode,
      });
    } else {
      throw new Error(error);
    }
  }
}

export async function createTaskRequest({
  taskID,
  providerAddress,
  price,
  deadline,
  clientVerification,
  computationCode,
  verificationCode,
}: TCreateTask) {
  makeRequest({
    taskID,
    providerAddress,
    price,
    deadline,
    clientVerification,
    computationCode,
    verificationCode,
  }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
