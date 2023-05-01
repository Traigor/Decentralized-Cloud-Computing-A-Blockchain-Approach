import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function activateTask() {
  const [deployer, client, provider] = await ethers.getSigners();
  // const tasksManager = await ethers.getContract("TasksManager");
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const providerCollateral = 500;
  const wei = 1000000000000000000;

  const value = ethers.utils.parseEther(
    (providerCollateral / wei).toFixed(18).toString()
  );
  await tasksManager.activateTask(taskID, { value: value });

  const taskState = await tasksManager.getTaskState(taskID);
  const activationTime = await tasksManager.getActivationTime(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Task activated!\n Task ID: ${taskID}\n State: ${taskState}\n Activation time: ${activationTime}`
  );
  console.log("----------------------------------------------------");
}

activateTask().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
