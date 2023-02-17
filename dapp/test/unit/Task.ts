import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { Task } from "../../typechain-types";

describe("Task Unit Tests", function () {
  let task: Task;
  let taskContract: Task;
  let deployer: SignerWithAddress;
  let otherAccounts: SignerWithAddress[];

  beforeEach(async function () {
    [deployer, ...otherAccounts] = await ethers.getSigners();
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
        "0xC3DFE1646524c6F3303C647Cc3B7Ef90967feFC9",
        "0x9F1a751994D1709D8A1e8d3a2d0223eB00B30391",
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
});
