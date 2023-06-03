import { ethers } from "hardhat";
import { abi, address } from "../TasksManager.json";
import { splitFields } from "../splitFields";
// import { create } from "ipfs-core";
export async function getPerformance(provider: string) {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );
  const performance = await tasksManager.getPerformance(provider);

  console.log("----------------------------------------------------");
  console.log(
    `Provider performance:\n Provider: ${provider}\n Performance: ${performance}`
  );
  console.log("----------------------------------------------------");
}

const provider = "0xB3b0E9E018bA957e29d6C883A84412972C6A7366";
console.log(
  splitFields("19998 ----- Hello world ----- 45 ----- 1682867531908\n")
);

getPerformance(provider).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
