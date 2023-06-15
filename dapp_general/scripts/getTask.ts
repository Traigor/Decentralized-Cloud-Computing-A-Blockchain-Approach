import { ethers } from "hardhat";

export async function getTask(address: string, taskID: string) {
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = await tasksManagerContract.attach(address);
  const task = await tasksManager.getTask(taskID);
  console.log(task);
  console.log("----------------------------------------------------");
  console.log(
    `TaskID: ${taskID}
    Provider: ${task.provider}
    Client: ${task.client}
    Price: ${task.price}
    Provider collateral: ${task.providerCollateral}
    Client collateral: ${task.clientCollateral}
    Payment: ${task.payment}
    Deadline: ${task.deadline}
    Duration: ${task.duration}
    ActivationTime: ${task.activationTime}
    TimeResultProvided: ${task.timeResultProvided}
    TimeResultReceived: ${task.timeResultReceived}
    ComputationCode: ${task.computationCode}
    VerificationCode: ${task.verificationCode}
    Results:${task.results}
    Client verification: ${task.clientVerification}
    Provider Verification: ${task.providerVerification}
    Task State: ${task.taskState}
    Payment State: ${task.paymentState}`
  );
  console.log("----------------------------------------------------");
}
