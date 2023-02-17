import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { Registry } from "../../typechain-types";

describe("Registry Unit Tests", function () {
  let registry: Registry;
  let registryContract: Registry;
  let deployer: SignerWithAddress;
  let provider: SignerWithAddress;
  let task: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  beforeEach(async function () {
    [deployer, provider, task, otherAccount] = await ethers.getSigners();
    await deployments.fixture(["registry"]);
    registryContract = await ethers.getContract("Registry");
    registry = registryContract.connect(deployer);
  });

  describe("constructor", function () {
    it("initializes the registry and sets the owner", async function () {
      const registryOwner = await registry.getOwner();
      expect(registryOwner).to.equal(deployer.address);
    });
  });

  describe("registerTask", function () {
    it("reverts if not called by the owner", async function () {
      const otherRegistry = registryContract.connect(otherAccount);
      await expect(otherRegistry.registerTask(task.address)).to.be.revertedWith(
        "Method can be called only by owner."
      );
    });

    it("registerTask is successful", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      const registeredTask = await otherRegistry.isRegistered();
      expect(registeredTask).to.equal(true);
    });

    it("emits a TaskRegistered event", async function () {
      await expect(registry.registerTask(task.address))
        .to.emit(registry, "TaskRegistered")
        .withArgs(task.address);
    });
  });

  describe("unregisterTask", function () {
    it("reverts if the task is not registered", async function () {
      const otherRegistry = registryContract.connect(task);
      await expect(otherRegistry.unregisterTask()).to.be.revertedWith(
        "Task must be registered"
      );
    });

    it("unregisterTask is successful", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      await otherRegistry.unregisterTask();
      const registeredTask = await otherRegistry.isRegistered();
      expect(registeredTask).to.equal(false);
    });

    it("emits a TaskUnregistered event", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      await expect(otherRegistry.unregisterTask())
        .to.emit(registry, "TaskUnregistered")
        .withArgs(task.address);
    });
  });

  describe("upVote", function () {
    it("reverts if the task is not registered", async function () {
      await expect(registry.upVote(provider.address)).to.be.revertedWith(
        "Task must be registered"
      );
    });

    it("upVote is successful", async function () {
      await registry.registerTask(task.address);
      const previouesUpVotes = await (
        await registry.getPerformance(provider.address)
      ).upVotes.toNumber();
      const otherRegistry = registryContract.connect(task);
      await otherRegistry.upVote(provider.address);
      const currentUpVotes = await (
        await registry.getPerformance(provider.address)
      ).upVotes.toNumber();
      expect(currentUpVotes).to.equal(previouesUpVotes + 1);
    });

    it("emits a ProviderUpvoted event", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      await expect(otherRegistry.upVote(provider.address))
        .to.emit(registry, "ProviderUpvoted")
        .withArgs(provider.address, task.address);
    });
  });

  describe("downVote", function () {
    it("reverts if the task is not registered", async function () {
      await expect(registry.downVote(provider.address)).to.be.revertedWith(
        "Task must be registered"
      );
    });

    it("downVote successfully", async function () {
      await registry.registerTask(task.address);
      const previouesDownVotes = await (
        await registry.getPerformance(provider.address)
      ).downVotes.toNumber();
      const otherRegistry = registryContract.connect(task);
      await otherRegistry.downVote(provider.address);
      const currentDownVotes = await (
        await registry.getPerformance(provider.address)
      ).downVotes.toNumber();
      expect(currentDownVotes).to.equal(previouesDownVotes + 1);
    });

    it("emits a ProviderDownvoted event", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      await expect(otherRegistry.downVote(provider.address))
        .to.emit(registry, "ProviderDownvoted")
        .withArgs(provider.address, task.address);
    });
  });

  describe("getPerformance", function () {
    it("returns the correct performance", async function () {
      await registry.registerTask(task.address);
      const otherRegistry = registryContract.connect(task);
      await otherRegistry.upVote(provider.address);
      await otherRegistry.downVote(provider.address);
      const performance = await registry.getPerformance(provider.address);
      expect(performance.upVotes.toNumber()).to.equal(1);
      expect(performance.downVotes.toNumber()).to.equal(1);
    });
  });

  describe("fallback", function () {
    it("reverts", async function () {
      await expect(deployer.sendTransaction({ to: registry.address })).to.be
        .reverted;
    });
  });

  describe("receive", function () {
    it("reverts with bad call", async function () {
      await expect(
        deployer.sendTransaction({ to: registry.address, value: 1 })
      ).to.be.revertedWith("bad call");
    });
  });
});
