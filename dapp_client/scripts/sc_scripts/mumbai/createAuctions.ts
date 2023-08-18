import { ethers } from "hardhat";
import { abi, address } from "../../../AuctionsManagerMumbai.json";
import { staller } from "../staller";

const maxRetries = 10;
let retries = 0;
type TCreateAuction = {
  auctionID: string;
  auctionDeadline: number;
  taskDeadline: number;
  clientVerification: string;
  code: string;
};
async function createAuction({
  auctionID,
  auctionDeadline,
  taskDeadline,
  clientVerification,
  code,
}: TCreateAuction) {
  const auctionsManager = new ethers.Contract(
    address,
    abi,
    ethers.provider.getSigner()
  );

  await auctionsManager.createAuction(
    auctionID,
    auctionDeadline,
    taskDeadline,
    clientVerification,
    code
  );
}

async function makeRequest({
  auctionID,
  auctionDeadline,
  taskDeadline,
  clientVerification,
  code,
}: TCreateAuction) {
  try {
    await createAuction({
      auctionID,
      auctionDeadline,
      taskDeadline,
      clientVerification,
      code,
    });
  } catch (error) {
    if (
      (error._isProviderError || error.code === "NETWORK_ERROR") &&
      retries < maxRetries
    ) {
      const retryAfter = Math.floor(Math.random() * 251) + 9000; // Generate a random wait time between 9000ms and 9250ms
      retries++;
      console.log(
        `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
      );
      await staller(retryAfter);
      await makeRequest({
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        code,
      });
    } else if (error.reason && retries < maxRetries) {
      console.log("----------------------------------------------------");
      console.log(error.reason);
      console.log("----------------------------------------------------");
      // const retryAfter = Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
      // retries++;
      // console.log(`Retrying after ${retryAfter} ms...`);
      // await staller(retryAfter);
      // await makeRequest({
      //   taskID,
      //   providerAddress,
      //   price,
      //   deadline,
      //   clientVerification,
      //   computationCode,
      //   verificationCode,
      // });
    } else {
      throw new Error(error);
    }
  }
}

export async function createAuctionRequest({
  auctionID,
  auctionDeadline,
  taskDeadline,
  clientVerification,
  code,
}: TCreateAuction) {
  makeRequest({
    auctionID,
    auctionDeadline,
    taskDeadline,
    clientVerification,
    code,
  }).catch((error) => {
    if (!error._isProviderError) console.error(error);
  });
}
