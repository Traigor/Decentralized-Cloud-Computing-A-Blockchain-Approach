import { ethers } from "hardhat";

export async function activateTask(address: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  // const address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(provider);

  const taskID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const providerCollateral = 500;
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
