import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function getTask(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, deployer);
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
