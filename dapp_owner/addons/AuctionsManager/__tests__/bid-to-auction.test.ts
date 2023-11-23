import { AuctionsManager } from "../AuctionsManager";
import {
  address as AUCTIONS_MANAGER_ADDRESS,
  abi as AUCTIONS_MANAGER_ABI,
} from "../../../deployments/localhost/AuctionsManager.json";
import { address as TASKS_MANAGER_ADDRESS } from "../../../deployments/localhost/TasksManager.json";

import { ethers } from "hardhat";
import {
  AuctionDoesNotExistError,
  AuctionNotInStateError,
  TasksManagerNotSetError,
} from "../errors";
import { expect, assert } from "chai";
import { reset } from "@nomicfoundation/hardhat-network-helpers";

describe("bid to auction on AuctionsManager on localhost hardhat network", () => {
  let auctionsManager: AuctionsManager;
  let auctionDeadline: number;
  let taskDeadline: number;
  let clientVerification: string;
  let code: string;
  let ownerAddress: string;
  let clientAddress: string;
  let providerAddress: string;
  let auctionID: string;
  let bid: number;

  //hardhat network
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );
  const signerAsOwner = provider.getSigner(0);
  const signerAsClient = provider.getSigner(1);
  const signerAsProvider = provider.getSigner(2);

  beforeEach(async () => {
    // await hre.network.provider.send("hardhat_reset");
    // await reset();
    // await ethers.provider.send("hardhat_reset", []);
    auctionDeadline = 100;
    taskDeadline = 200;
    clientVerification =
      "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
    code = "code";
    bid = 100;

    ownerAddress = await signerAsOwner.getAddress();
    clientAddress = await signerAsClient.getAddress();
    providerAddress = await signerAsProvider.getAddress();
    auctionsManager = new AuctionsManager(
      AUCTIONS_MANAGER_ADDRESS,
      AUCTIONS_MANAGER_ABI,
      signerAsClient
    );
    auctionsManager.connect(signerAsClient);
    const createdAuction = await auctionsManager.createAuction({
      auctionDeadline,
      taskDeadline,
      clientVerification,
      code,
    });
    auctionID = createdAuction.event.auctionID;
  });

  it("should fail to bid to auction if tasks manager is not set", async () => {
    // this test is first because for the other tests we need to set the tasks manager
    //TODO find how to reset network
    try {
      auctionsManager.connect(signerAsProvider);
      await auctionsManager.bid(auctionID, bid);

      assert.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(TasksManagerNotSetError);
      expect(error.message).to.equal("TasksManager not set");
    }
  });

  it("should bid to auction successfully", async () => {
    auctionsManager.connect(signerAsOwner);
    await auctionsManager.setTasksManager(TASKS_MANAGER_ADDRESS);
    auctionsManager.connect(signerAsProvider);
    const bidAuction = await auctionsManager.bid(auctionID, bid);
    const event = bidAuction.event;
    expect(event.name).to.equal("BidPlaced");
    expect(event.auctionID).to.equal(auctionID);
    expect(event.provider).to.equal(providerAddress);
    expect(event.bid).to.equal(100);
  });

  it("should fail to bid to auction if auction does not exist", async () => {
    try {
      auctionsManager.connect(signerAsOwner);
      await auctionsManager.setTasksManager(TASKS_MANAGER_ADDRESS);
      auctionsManager.connect(signerAsProvider);
      await auctionsManager.bid("0x0", bid);
    } catch (error) {
      expect(error).to.be.instanceOf(AuctionDoesNotExistError);
      expect(error.message).to.equal("Auction does not exist");
    }
  });

  it("should fail to bid to auction if auction is not in state Created", async () => {
    try {
      auctionsManager.connect(signerAsOwner);
      await auctionsManager.setTasksManager(TASKS_MANAGER_ADDRESS);
      auctionsManager.connect(signerAsClient);
      await auctionsManager.cancelAuction(auctionID);
      auctionsManager.connect(signerAsProvider);
      await auctionsManager.bid(auctionID, bid);
    } catch (error) {
      expect(error).to.be.instanceOf(AuctionNotInStateError);
      expect(error.message).to.equal("Auction not in state Created");
    }
  });
});
