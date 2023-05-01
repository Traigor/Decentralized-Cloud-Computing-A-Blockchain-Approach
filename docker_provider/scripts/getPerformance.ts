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

async function ipfsTest() {
  const { create } = await import("ipfs-core");
  const node = await create();

  const stream = node.cat("QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A");
  const decoder = new TextDecoder();
  let data = "";

  for await (const chunk of stream) {
    // chunks of data are returned as a Uint8Array, convert it back to a string
    data += decoder.decode(chunk, { stream: true });
  }

  console.log(data);
}

ipfsTest();
getPerformance(provider).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
