import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments, tasks } from "hardhat";
import { AuctionsManager, TasksManager } from "../../typechain-types";
import { BigNumber } from "ethers";
import {
  address as TasksManagerAddress,
  abi as TasksManagerAbi,
} from "../../deployments/localhost/TasksManager.json";
import { address as AuctionsManagerAddress } from "../../deployments/localhost/AuctionsManager.json";

describe("Auctions Manager", function () {
  let auctionsManager: AuctionsManager;
  let auctionsManagerContract: AuctionsManager;
  let deployer: SignerWithAddress;
  let provider: SignerWithAddress;
  let client: SignerWithAddress;
  let otherAccounts: SignerWithAddress[];
  let auctionID: string;
  let auctionDeadline: number;
  let taskDeadline: number;
  let clientVerification: string;
  let verificationCode: string;
  let computationCode: string;
  let _bid: number;
  const wei: number = 1000000000000000000;

  beforeEach(async function () {
    [deployer, client, provider, ...otherAccounts] = await ethers.getSigners();
    await deployments.fixture(["auctionsManager"]);
    auctionsManagerContract = await ethers.getContract("AuctionsManager");
    auctionsManager = auctionsManagerContract.connect(deployer);

    auctionID =
      "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
    auctionDeadline = 120;
    taskDeadline = 600;
    clientVerification =
      "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
    verificationCode = "verificationIPFS";
    computationCode = "computationIPFS";
    _bid = 10;
  });

  describe("constructor", function () {
    it("initializes the auctionsManager and sets the owner", async function () {
      const owner = await auctionsManager.getOwner();
      const tasksManager = await auctionsManager.getTasksManager();
      expect(owner).to.equal(deployer.address);
      expect(tasksManager).to.equal(TasksManagerAddress);
    });
  });

  describe("createAuction", function () {
    it("createAuction is successful", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      const createdAuction = (
        await auctionsManager.createAuction(
          auctionID,
          auctionDeadline,
          taskDeadline,
          clientVerification,
          verificationCode,
          computationCode
        )
      ).wait();
      const events = (await createdAuction).events as unknown as Event[];
      const auctionState = await auctionsManager.getAuctionState(auctionID);
      expect(auctionState).to.equal("Created");
      expect(events[0].event).to.equal("AuctionCreated");
      expect(events[0].args?.auctionID).to.equal(auctionID);
    });

    it("reverts if auction already exists", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await expect(
        auctionsManager.createAuction(
          auctionID,
          auctionDeadline,
          taskDeadline,
          clientVerification,
          verificationCode,
          computationCode
        )
      ).to.be.revertedWith("Auction already exists");
    });
  });

  describe("cancelAuction", function () {
    it("cancelAuction is successful", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      const cancelledAuction = (
        await auctionsManager.cancelAuction(auctionID)
      ).wait();
      const events = (await cancelledAuction).events as unknown as Event[];
      const auctionState = await auctionsManager.getAuctionState(auctionID);
      expect(auctionState).to.equal("Cancelled");
      expect(events[0].event).to.equal("AuctionCancelled");
      expect(events[0].args?.auctionID).to.equal(auctionID);
    });
    it("reverts if not called by the client", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await expect(auctionsManager.cancelAuction(auctionID)).to.be.revertedWith(
        "Method can be called only by client."
      );
    });

    it("reverts if auction is not in created state", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await expect(auctionsManager.cancelAuction(auctionID));
      await expect(auctionsManager.cancelAuction(auctionID)).to.be.revertedWith(
        "Invalid AuctionState."
      );
    });
  });

  describe("bid", function () {
    it("bid is successful", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      const bid = (await auctionsManager.bid(auctionID, _bid)).wait();
      const events = (await bid).events as unknown as Event[];
      const currentBid = await auctionsManager.getAuctionBids(auctionID);
      expect(currentBid.length).to.equal(1);
      expect(events[0].event).to.equal("BidPlaced");
      expect(events[0].args?.auctionID).to.equal(auctionID);
      expect(events[0].args?.provider).to.equal(provider.address);
      expect(events[0].args?.bid).to.equal(BigNumber.from(_bid));
      expect(currentBid[0].provider).to.equal(provider.address);
      expect(currentBid[0].bid).to.equal(BigNumber.from(_bid));
      expect(currentBid[0].providerDownVotes).to.equal(0);
      expect(currentBid[0].providerUpVotes).to.equal(0);
    });
    it("reverts if auction is not in created state", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await auctionsManager.cancelAuction(auctionID);
      auctionsManager = auctionsManagerContract.connect(provider);
      await expect(auctionsManager.bid(auctionID, _bid)).to.be.revertedWith(
        "Invalid AuctionState."
      );
    });
    it("reverts if called by client", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await expect(auctionsManager.bid(auctionID, _bid)).to.be.revertedWith(
        "Client can't bid to this auction"
      );
    });
    it("reverts if time has expired", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await ethers.provider.send("evm_increaseTime", [auctionDeadline + 1]);
      auctionsManager = auctionsManagerContract.connect(provider);
      await expect(auctionsManager.bid(auctionID, _bid)).to.be.revertedWith(
        "Time has expired."
      );
    });
    it("reverts if provider's bid is not lower than the previous one", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      await expect(auctionsManager.bid(auctionID, _bid + 1)).to.be.revertedWith(
        "Bid is not lower than than the previous one."
      );
    });
  });

  describe("finalize", function () {
    it("finalize is successful", async function () {
      const tasksManager = new ethers.Contract(
        TasksManagerAddress,
        TasksManagerAbi,
        ethers.provider.getSigner()
      );
      await tasksManager.setAuctionAddress(auctionsManager.address);

      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      auctionsManager = auctionsManagerContract.connect(client);
      const auctionBids = await auctionsManager.getAuctionBids(auctionID);
      const clientCollateral = ethers.utils.parseEther(
        ((_bid * 2) / wei).toFixed(18).toString()
      );
      auctionsManager = auctionsManagerContract.connect(client);

      const finalizedAuction = (
        await auctionsManager.finalize(auctionID, auctionBids[0].provider, {
          value: clientCollateral,
        })
      ).wait();
      const events = (await finalizedAuction).events as unknown as Event[];
      const auctionState = await auctionsManager.getAuctionState(auctionID);
      const winnerBid = await auctionsManager.getWinnerBid(auctionID);
      expect(auctionState).to.equal("Finalized");
      expect(winnerBid.bid).to.equal(auctionBids[0].bid);
      expect(winnerBid.provider).to.equal(auctionBids[0].provider);
      expect(events[0].event).to.equal("AuctionFinalized");
      expect(events[0].args?.auctionID).to.equal(auctionID);
      expect(events[0].args?.provider).to.equal(provider.address);
    });
    it("reverts if not called by client", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      await expect(
        auctionsManager.finalize(auctionID, provider.address)
      ).to.be.revertedWith("Method can be called only by client.");
    });
    it("reverts if not in status created", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      await auctionsManager.cancelAuction(auctionID);
      await expect(
        auctionsManager.finalize(auctionID, provider.address)
      ).to.be.revertedWith("Invalid AuctionState.");
    });
    it("reverts if auction has no bids", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );

      await expect(
        auctionsManager.finalize(auctionID, provider.address)
      ).to.be.revertedWith("Auction has no bids.");
    });
    it("reverts if wrong provider address is passed", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      auctionsManager = auctionsManagerContract.connect(client);
      await expect(
        auctionsManager.finalize(auctionID, deployer.address)
      ).to.be.revertedWith("Wrong provider address");
    });
    it("reverts if client collateral is not enough", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      auctionsManager = auctionsManagerContract.connect(client);
      const clientCollateral = ethers.utils.parseEther(
        ((_bid * 1) / wei).toFixed(18).toString()
      );
      await expect(
        auctionsManager.finalize(auctionID, deployer.address, {
          value: clientCollateral,
        })
      ).to.be.revertedWith("Wrong provider address");
    });
  });

  describe("deleteAuctions", function () {
    beforeEach(async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.createAuction(
        auctionID,
        auctionDeadline,
        taskDeadline,
        clientVerification,
        verificationCode,
        computationCode
      );
    });
    it("reverts if not called by the owner", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await expect(auctionsManager.deleteAuctions()).to.be.revertedWith(
        "Method can be called only by owner."
      );
    });
    it("deleteAuctions is successful, auction in state Finalized", async function () {
      const tasksManager = new ethers.Contract(
        TasksManagerAddress,
        TasksManagerAbi,
        ethers.provider.getSigner()
      );
      await tasksManager.setAuctionAddress(auctionsManager.address);
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      auctionsManager = auctionsManagerContract.connect(client);
      const clientCollateral = ethers.utils.parseEther(
        ((_bid * 2) / wei).toFixed(18).toString()
      );
      await auctionsManager.finalize(auctionID, provider.address, {
        value: clientCollateral,
      });
      auctionsManager = auctionsManagerContract.connect(deployer);
      await ethers.provider.send("evm_increaseTime", [60 + 1]);
      await auctionsManager.deleteAuctions();
    });
    it("deleteAuctions is successful, auction in state Cancelled", async function () {
      auctionsManager = auctionsManagerContract.connect(client);
      await auctionsManager.cancelAuction(auctionID);
      auctionsManager = auctionsManagerContract.connect(deployer);
      await ethers.provider.send("evm_increaseTime", [60 + 1]);
      await auctionsManager.deleteAuctions();
    });
    it("deleteAuctions is unsuccessful, time has not passed", async function () {
      const tasksManager = new ethers.Contract(
        TasksManagerAddress,
        TasksManagerAbi,
        ethers.provider.getSigner()
      );
      await tasksManager.setAuctionAddress(auctionsManager.address);
      auctionsManager = auctionsManagerContract.connect(provider);
      await auctionsManager.bid(auctionID, _bid);
      auctionsManager = auctionsManagerContract.connect(client);
      const clientCollateral = ethers.utils.parseEther(
        ((_bid * 2) / wei).toFixed(18).toString()
      );
      await auctionsManager.finalize(auctionID, provider.address, {
        value: clientCollateral,
      });
      auctionsManager = auctionsManagerContract.connect(deployer);
      await auctionsManager.deleteAuctions();
    });
  });
});
