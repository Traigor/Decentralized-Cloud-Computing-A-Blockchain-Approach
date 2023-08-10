import { ethers } from "hardhat";
import {
  abi as tasksAbi,
  address as tasksAddress,
} from "../deployments/localhost/TasksManager.json";
export async function createTask(taskID: string) {
  const [deployer, client, provider] = await ethers.getSigners();
  const tasksManager = new ethers.Contract(tasksAddress, tasksAbi, client);

  const price = 30;
  const providerCollateral = price * 10;
  const deadline = 600;
  const clientVerification =
    "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";

  const ipfs = "test";
  const wei = 1000000000000000000;
  const clientCollateral = price * 2;
  const value = ethers.utils.parseEther(
    (clientCollateral / wei).toFixed(18).toString()
  );

  await tasksManager.createTask(
    taskID,
    provider.address,
    price,
    deadline,
    clientVerification,
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
