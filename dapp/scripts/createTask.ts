import { ethers } from "hardhat";

export async function createTask() {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManagerContract = await ethers.getContract("TasksManager");
  const tasksManager = tasksManagerContract.connect(client);

  const taskID =
    "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const price = 30;
  const providerCollateral = 500;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";

  const ipfs = "test";
  const wei = 1000000000000000000;
  const clientCollateral = 100;
  const value = ethers.utils.parseEther(
    (clientCollateral / wei).toFixed(18).toString()
  );

  await tasksManager.createTask(
    taskID,
    provider.address,
    price,
    providerCollateral,
    deadline,
    clientVerification,
    ipfs,
    ipfs,
    { value: value }
  );

  const taskState = await tasksManager.getTaskState(taskID);
  console.log("----------------------------------------------------");
  console.log(
    `Task created!\n Address: ${tasksManager.address}\n Task ID: ${taskID}\n Client: ${client.address}\n Provider: ${provider.address}\n Price: ${price}\n Provider collateral: ${providerCollateral}\n Deadline: ${deadline}\n Client verification: ${clientVerification}\n State: ${taskState} \n IPFS: ${ipfs}`
  );
  console.log("----------------------------------------------------");

  return tasksManager.address;
}
