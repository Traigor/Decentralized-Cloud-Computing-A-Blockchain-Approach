import { ethers } from "hardhat";
import { abi, address } from "../../deployments/sepolia/TasksManager.json";

export async function completePayment(payment: number) {
  // const tasksManager = await ethers.getContract("TasksManager");
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  // const wei = 1000000000000000000;
  // const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());
  const taskID =
    "0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
  const wei = 1000000000000000000;

  const value = ethers.utils.parseEther((payment / wei).toFixed(18).toString());
  await tasksManager.completePayment(taskID, {
    value: value,
  });

  console.log("----------------------------------------------------");
  console.log(`Payment completed!\n Task ID: ${taskID}\n Payment: ${payment}`);
  console.log("----------------------------------------------------");
}

const payment = 1677891469452;
completePayment(payment).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
