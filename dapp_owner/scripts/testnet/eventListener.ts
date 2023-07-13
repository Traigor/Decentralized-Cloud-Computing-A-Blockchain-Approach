import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export default async function listen() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  console.log(`Listening on events of TasksManager contract... ${address}`);

  tasksManager.on("TaskCreated", (taskID) => {
    console.log(`[TaskCreated] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskCancelled", (taskID) => {
    console.log(`[TaskCancelled] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskActivated", (taskID) => {
    console.log(`[TaskActivated] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskInvalidated", (taskID) => {
    console.log(`[TaskInvalidated] TaskID: ${taskID}`);
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
    console.log(`[PaymentPending] TaskID: ${taskID} Payment: ${payment}`);
  });
  tasksManager.on("TaskCompletedSuccessfully", (taskID) => {
    console.log(`[TaskCompletedSuccessfully] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskCompletedUnsuccessfully", (taskID) => {
    console.log(`[TaskCompletedUnsuccessfully] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskReceivedResultsSuccessfully", (taskID) => {
    console.log(`[TaskReceivedResultsSuccessfully] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskReceivedResultsUnsuccessfully", (taskID) => {
    console.log(`[TaskReceivedResultsUnsuccessfully] TaskID: ${taskID}`);
  });
  tasksManager.on("TaskDeleted", (taskID) => {
    console.log(`[TaskDeleted] TaskID: ${taskID}`);
  });
  tasksManager.on("PaymentCompleted", (taskID) => {
    console.log(`[PaymentCompleted] TaskID: ${taskID}`);
  });
  tasksManager.on("ProviderUpvoted", (provider, task) => {
    console.log(`[ProviderUpvoted] Provider: ${provider} TaskID: ${task}`);
  });
  tasksManager.on("ProviderDownvoted", (provider, task) => {
    console.log(`[ProviderDownvoted] Provider: ${provider} TaskID: ${task}`);
  });
}

listen();
