import { ethers } from "hardhat";
import { abi, address } from "../../../deployments/sepolia/TasksManager.json";
const taskID = process.env.TASK_ID;

export async function getTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const task = await tasksManager.getTask(taskID);
  // console.log(task);
  console.log("----------------------------------------------------");
  console.log(
    `TaskID: ${taskID}
      Provider: ${task.provider}
      Client: ${task.client}
      Price: ${task.price}
      Provider collateral: ${task.providerCollateral}
      Client collateral: ${task.clientCollateral}
      Cost: ${task.cost}
      Deadline: ${task.deadline}
      Duration: ${task.duration}
      ActivationTime: ${task.activationTime}
      TimeResultProvided: ${task.timeResultProvided}
      TimeResultReceived: ${task.timeResultReceived}
      ComputationCode: ${task.computationCode}
      VerificationCode: ${task.verificationCode}
      Results:${task.results}
      Client verification: ${task.clientVerification}
      Task State: ${task.taskState}
      Payment State: ${task.paymentState}`
  );
  console.log("----------------------------------------------------");
}

getTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
