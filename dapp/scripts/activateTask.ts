import { ethers } from "hardhat";

export async function activateTask(address: string, taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  // const address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(provider);
  const price = 30;
  const providerCollateral = price * 10;
  const wei = 1000000000000000000;

  const value = ethers.utils.parseEther(
    (providerCollateral / wei).toFixed(18).toString()
  );
  await task.activateTask(taskID, { value: value });

  const taskState = await task.getTaskState(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task activated!\n Task ID: ${taskID}\n State: ${taskState}`);
  console.log("----------------------------------------------------");
}
