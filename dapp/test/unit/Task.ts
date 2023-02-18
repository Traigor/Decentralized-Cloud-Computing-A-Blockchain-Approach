import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { Task, Registry } from "../../typechain-types";

describe("Task Unit Tests", function () {
  let task: Task;
  let taskContract: Task;
  let registryContract: Registry;
  let registry: Registry;
  let deployer: SignerWithAddress;
  let provider: SignerWithAddress;
  let client: SignerWithAddress;
  let otherAccounts: SignerWithAddress[];

  beforeEach(async function () {
    [deployer, client, provider, ...otherAccounts] = await ethers.getSigners();
    await deployments.fixture(["registry"]);
    registryContract = await ethers.getContract("Registry");
    registry = registryContract.connect(deployer);
    await deployments.fixture(["task"]);
    taskContract = await ethers.getContract("Task");
    task = taskContract.connect(deployer);
  });

  describe("constructor", function () {
    //TODO: check for every variable
    it("initializes the task and sets the states correctly", async function () {
      const taskState = await task.getTaskState();
      const paymentState = await task.getPaymentState();
      expect(taskState).to.equal(0);
      expect(paymentState).to.equal(0);
    });

    it("emits a TaskCreated event", async function () {
      const newTaskContract = await ethers.getContractFactory("Task");
      const newTask = (await newTaskContract.deploy(
        "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff",
        client.address,
        provider.address,
        30,
        500,
        600,
        "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      )) as unknown as Task;
      await newTask.deployed();
      await expect(newTask.deployTransaction)
        .to.emit(newTask, "TaskCreated")
        .withArgs(newTask.address);
    });
  });

  describe("activateTask", function () {
    it("reverts if not called by the provider", async function () {
      await expect(task.activateTask()).to.be.revertedWith(
        "Method can be called only by provider."
      );
    });

    it("reverts if value sent is not the expected", async function () {
      task = taskContract.connect(provider);
      await expect(
        task.activateTask({
          value: ethers.utils.parseEther("0.0000000000000004"),
        })
      ).to.be.revertedWith("Value sent is not the expected");
    });

    it("reverts if task is not registered", async function () {
      task = taskContract.connect(provider);
      await expect(
        task.activateTask({
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      ).to.be.revertedWith("Task must be registered");
    });
  });
});
