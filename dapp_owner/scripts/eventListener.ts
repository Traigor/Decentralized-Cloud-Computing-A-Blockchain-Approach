import { ethers } from "hardhat";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xaddress";

export default async function listen() {
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = await tasksManagerContract.attach(CONTRACT_ADDRESS);
  console.log(
    `Listening on events of TasksManager contract... ${CONTRACT_ADDRESS}`
  );

  tasksManager.on("TaskCreated", (taskID) => {
    console.log(`[TaskCreated] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskCancelled", (taskID) => {
    console.log(`[TaskCancelled] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskActivated", (taskID) => {
    console.log(`[TaskActivated] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskInvalidated", (taskID) => {
    console.log(`[TaskInvalidated] Task ID: ${taskID}`);
  });
  tasksManager.on("TransferMadeToClient", (Address, Amount) => {
    console.log(`[TransferMadeToClient] Address: ${Address} Amount: ${Amount}`);
  });
  tasksManager.on("TransferMadeToProvider", (Address, Amount) => {
    console.log(
      `[TransferMadeToProvider] Address: ${Address} Amount: ${Amount}`
    );
  });
  tasksManager.on("PaymentPending", (taskID, payment) => {
    console.log(`[PaymentPending] Task ID: ${taskID} Payment: ${payment}`);
  });
  tasksManager.on("TaskCompletedSuccessfully", (taskID) => {
    console.log(`[TaskCompletedSuccessfully] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskCompletedUnsuccessfully", (taskID) => {
    console.log(`[TaskCompletedUnsuccessfully] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskReceivedResults", (taskID) => {
    console.log(`[TaskReceivedResults] Task ID: ${taskID}`);
  });
  tasksManager.on("TaskDeleted", (taskID) => {
    console.log(`[TaskDeleted] Task ID: ${taskID}`);
  });
  tasksManager.on("PaymentCompleted", (taskID) => {
    console.log(`[PaymentCompleted] Task ID: ${taskID}`);
  });
  tasksManager.on("ProviderUpvoted", (provider, task) => {
    console.log(`[ProviderUpvoted] Provider: ${provider} TaskID: ${task}`);
  });
  tasksManager.on("ProviderDownvoted", (provider, task) => {
    console.log(`[ProviderDownvoted] Provider: ${provider} TaskID: ${task}`);
  });
}

listen();
