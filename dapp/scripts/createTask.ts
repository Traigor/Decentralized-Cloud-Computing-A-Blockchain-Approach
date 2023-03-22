import { ethers, deployments } from "hardhat";

export async function createTask() {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = tasksManagerContract.connect(deployer);

  //   const TasksManager = await ethers.getContractFactory("TasksManager");
  //   const tasksManager = await TasksManager.deploy();

  //   await tasksManager.deployed();

  const taskID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const price = 30;
  const providerCollateral = 500;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";

  await tasksManager.createTask(
    taskID,
    client.address,
    provider.address,
    price,
    providerCollateral,
    deadline,
    clientVerification
  );

  const taskState = await tasksManager.getTaskState(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Task created!\n Address: ${tasksManager.address}\n Task ID: ${taskID}\n Client: ${client.address}\n Provider: ${provider.address}\n Price: ${price}\n Provider collateral: ${providerCollateral}\n Deadline: ${deadline}\n Client verification: ${clientVerification}\n State: ${taskState}`
  );
  console.log("----------------------------------------------------");

  return tasksManager.address;
}
