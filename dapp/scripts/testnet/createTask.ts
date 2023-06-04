import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";
export async function createTask() {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  // const tasksManager = await ethers.getContract("TasksManager");

  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const providerAddress = "0xB3b0E9E018bA957e29d6C883A84412972C6A7366";
  const price = 10;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
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
    "ipfsVer",
    "ipfsComp",
    { value: value }
  );

  const taskState = await tasksManager.getTaskState(taskID);
  const activationTime = await tasksManager.getActivationTime(taskID);

  console.log("----------------------------------------------------");
  console.log(
    `Task created!\n Address: ${tasksManager.address}\n Task ID: ${taskID}\n Provider: ${providerAddress}\n Price: ${price}\n \n Deadline: ${deadline}\n Client verification: ${clientVerification}\n State: ${taskState}\n Activation time: ${activationTime}`
  );
  console.log("----------------------------------------------------");
}

createTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
