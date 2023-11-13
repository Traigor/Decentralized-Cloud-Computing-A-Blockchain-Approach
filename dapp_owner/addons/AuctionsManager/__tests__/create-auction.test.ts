import { AuctionsManager } from "../AuctionsManager";
import {
  address as AUCTIONS_MANAGER_ADDRESS,
  abi as AUCTIONS_MANAGER_ABI,
} from "../../../deployments/localhost/AuctionsManager.json";
import { address as TASKS_MANAGER_ADDRESS } from "../../../deployments/localhost/TasksManager.json";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("create auction on AuctionsManager on localhost hardhat network", () => {
  let auctionsManager: AuctionsManager;
  let auctionDeadline: number;
  let taskDeadline: number;
  let clientVerification: string;
  let code: string;
  let clientAddress: string;
  let providerAddress: string;

  //hardhat network
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );
  const signerAsClient = provider.getSigner(0);
  const signerAsProvider = provider.getSigner(1);

  beforeEach(async () => {
    auctionDeadline = 100;
    taskDeadline = 200;
    clientVerification =
      "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
    code = "code";
    clientAddress = await signerAsClient.getAddress();
    auctionsManager = new AuctionsManager(
      AUCTIONS_MANAGER_ADDRESS,
      AUCTIONS_MANAGER_ABI,
      signerAsClient
    );
    await auctionsManager.setTasksManager(TASKS_MANAGER_ADDRESS);
  });

  it("should create auction successfully", async () => {
    auctionsManager.connect(signerAsProvider);
    const activeAuctionsInitial = await auctionsManager.getActiveAuctions();

    auctionsManager.connect(signerAsClient);
    const createdAuction = await auctionsManager.createAuction({
      auctionDeadline,
      taskDeadline,
      clientVerification,
      code,
    });
    const event = createdAuction.event;

    auctionsManager.connect(signerAsProvider);

    const activeAuctionsFinal = await auctionsManager.getActiveAuctions();
    expect(event.name).to.equal("AuctionCreated");
    expect(event.client).to.equal(clientAddress);
    expect(activeAuctionsFinal.length).to.equal(
      activeAuctionsInitial.length + 1
    );
  });
});
