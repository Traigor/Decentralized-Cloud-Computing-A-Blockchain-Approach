import { ethers, deployments } from "hardhat";

export async function cancelTask(address: string, taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  // const address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tasksManager = await tasksManagerContract.attach(address);
  const task = tasksManager.connect(client);

  await task.cancelTask(taskID);

  console.log("----------------------------------------------------");
  console.log(`Task cancelled!\n Task ID: ${taskID}`);
  console.log("----------------------------------------------------");
}
