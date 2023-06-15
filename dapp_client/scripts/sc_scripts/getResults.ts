import { ethers } from "hardhat";
import { abi, address } from "../../TasksManager.json";

type TGetResults = {
  taskID: string;
};

async function getResults({ taskID }: TGetResults): Promise<string> {
  const tasksManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  const results = await tasksManager.getResults(taskID);
  return results;
}

export async function getResultsRequest({
  taskID,
}: TGetResults): Promise<string | void> {
  const results = getResults({ taskID }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  return results;
}
