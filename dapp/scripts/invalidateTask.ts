import { ethers, deployments } from "hardhat";

export async function invalidateTask(address: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  // const address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(client);

  const taskID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  await ethers.provider.send("evm_increaseTime", [610]);

  await task.invalidateTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task invalidated!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
