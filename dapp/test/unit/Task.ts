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
  let taskID: string;
  let price: number;
  let wei: number;

  beforeEach(async function () {
    [deployer, client, provider, ...otherAccounts] = await ethers.getSigners();
    await deployments.fixture(["registry"]);
    registryContract = await ethers.getContract("Registry");
    registry = registryContract.connect(deployer);
    await deployments.fixture(["task"]);
    taskContract = await ethers.getContract("Task");
    task = taskContract.connect(deployer);

    taskID =
      "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
    price = 30;
    wei = 1000000000000000000;
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
        taskID,
        client.address,
        provider.address,
        price,
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

  describe("cancelTask", function () {
    it("reverts if not called by the client", async function () {
      await expect(task.cancelTask()).to.be.revertedWith(
        "Method can be called only by client."
      );
    });

    it("reverts if task is not in state Created", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await expect(task.cancelTask()).to.be.revertedWith("Invalid TaskState.");
    });

    it("balance is correct", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await task.cancelTask();
      const balance = await ethers.provider.getBalance(task.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("cancelTask is successful", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await task.cancelTask();
      const taskState = await task.getTaskState();
      const paymentState = await task.getPaymentState();
      expect(taskState).to.equal(1);
      expect(paymentState).to.equal(0);
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await expect(task.cancelTask())
        .to.emit(task, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await expect(task.cancelTask())
        .to.emit(task, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther("0"));
    });

    it("emits a TaskCancelled event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await expect(task.cancelTask())
        .to.emit(task, "TaskCancelled")
        .withArgs(taskID);
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

    it("reverts if task is not in state Created", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await expect(
        task.activateTask({
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      ).to.be.revertedWith("Invalid TaskState.");
    });

    it("reverts if task is not registered", async function () {
      task = taskContract.connect(provider);
      await expect(
        task.activateTask({
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      ).to.be.revertedWith("Task must be registered");
    });

    it("activateTask is successful", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const taskState = await task.getTaskState();
      const paymentState = await task.getPaymentState();
      expect(taskState).to.equal(2);
      expect(paymentState).to.equal(0);
      //TODO: add activationTime check
    });

    it("balance is correct", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const balance = await ethers.provider.getBalance(task.address);
      const amount = (
        (await task.getProviderCollateral()).toNumber() / wei
      ).toFixed(18);
      expect(balance).to.equal(ethers.utils.parseEther(amount.toString()));
    });

    it("emits a TaskActivated event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await expect(
        task.activateTask({
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      )
        .to.emit(task, "TaskActivated")
        .withArgs(taskID); //TODO: get TaskID from the contract
    });
  });

  describe("invalidateTask", function () {
    it("reverts if not called by the client", async function () {
      await expect(task.invalidateTask()).to.be.revertedWith(
        "Method can be called only by client."
      );
    });

    it("reverts if task is not in state Active", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(client);
      await expect(task.invalidateTask()).to.be.revertedWith(
        "Invalid TaskState."
      );
    });

    it("reverts if time has not expired", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await expect(task.invalidateTask()).to.be.revertedWith(
        "Time has not expired."
      );
    });

    it("invalidateTask is successful", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await task.invalidateTask();
      const taskState = await task.getTaskState();
      const paymentState = await task.getPaymentState();
      expect(taskState).to.equal(4);
      expect(paymentState).to.equal(0);
    });

    it("balance is correct", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await task.invalidateTask();
      const balance = await ethers.provider.getBalance(task.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      const amount = (
        (await task.getProviderCollateral()).toNumber() / wei
      ).toFixed(18);
      await expect(task.invalidateTask())
        .to.emit(task, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });

    it("unregisterTask is successful", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await task.invalidateTask();
      registry = registryContract.connect(task.address);
      const isRegistered = await registry.isRegistered();
      await expect(isRegistered).to.equal(false);
    });

    it("emits a TaskInvalidated event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      task = taskContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await expect(task.invalidateTask())
        .to.emit(task, "TaskInvalidated")
        .withArgs(taskID); //TODO: get TaskID from the contract
    });
  });

  describe("completeTask", function () {
    it("reverts if not called by the provider", async function () {
      await expect(task.completeTask()).to.be.revertedWith(
        "Method can be called only by provider."
      );
    });

    it("reverts if task is not in state Active", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await expect(task.completeTask()).to.be.revertedWith(
        "Invalid TaskState."
      );
    });

    it("completeTask is successful, correct verification and in time", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("Helloworld!", Date.now());
      await task.completeTask();
      const taskState = await task.getTaskState();
      const paymentState = await task.getPaymentState();
      const balance = await ethers.provider.getBalance(task.address);
      expect(taskState).to.equal(3);
      expect(paymentState).to.equal(1);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("Helloworld!", Date.now());
      const amount = (
        (await task.getProviderCollateral()).toNumber() / wei
      ).toFixed(18);
      await expect(task.completeTask())
        .to.emit(task, "TransferMade")
        .withArgs(provider.address, ethers.utils.parseEther(amount.toString()));
    });

    it("emits a PaymentPending event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await task.receiveResults("Helloworld!", time);
      const duration = time - (await task.getActivationTime()).toNumber();
      const payment = ((price * duration) / wei).toString();
      await expect(task.completeTask())
        .to.emit(task, "PaymentPending")
        .withArgs(taskID, ethers.utils.parseEther(payment));
    });

    it("emits a TaskCompleted event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("Helloworld!", Date.now());
      await expect(task.completeTask())
        .to.emit(task, "TaskCompleted")
        .withArgs(taskID); //TODO: get TaskID from the contract
    });

    it("completeTask is successful, false verification and in time", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("HelloWorld!", Date.now());
      await task.completeTask();
      const taskState = await task.getTaskState();
      const balance = await ethers.provider.getBalance(task.address);
      expect(taskState).to.equal(3);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("HelloWorld!", Date.now());
      const amount = (
        (await task.getProviderCollateral()).toNumber() / wei
      ).toFixed(18);
      await expect(task.completeTask())
        .to.emit(task, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });

    it("completeTask is successful, correct verification and out of time", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await ethers.provider.send("evm_increaseTime", [601]);
      await task.receiveResults("Helloworld!", Date.now());
      await task.completeTask();
      const taskState = await task.getTaskState();
      const balance = await ethers.provider.getBalance(task.address);
      expect(taskState).to.equal(3);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("HelloWorld!", Date.now());
      const amount = (
        (await task.getProviderCollateral()).toNumber() / wei
      ).toFixed(18);
      await expect(task.completeTask())
        .to.emit(task, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });
  });

  describe("completePayment", function () {
    it("reverts if not called by the client", async function () {
      await expect(task.completePayment()).to.be.revertedWith(
        "Method can be called only by client."
      );
    });

    it("reverts if task is not in state Completed", async function () {
      task = taskContract.connect(client);
      await expect(task.completePayment()).to.be.revertedWith(
        "Invalid TaskState."
      );
    });

    it("reverts if value sent is not the expected", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await task.receiveResults("Helloworld!", Date.now());
      await task.completeTask();
      task = taskContract.connect(client);
      await expect(
        task.completePayment({
          value: ethers.utils.parseEther("0.0000000000000004"),
        })
      ).to.be.revertedWith("Value sent is not the expected");
    });

    it("completePayment is successful", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await task.receiveResults("Helloworld!", time);
      const duration = time - (await task.getActivationTime()).toNumber();
      const payment = ((price * duration) / wei).toString();
      await task.completeTask();
      task = taskContract.connect(client);
      await task.completePayment({
        value: ethers.utils.parseEther(payment),
      });
      const paymentState = await task.getPaymentState();
      expect(paymentState).to.equal(2);
    });

    it("emits a TransferMade event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await task.receiveResults("Helloworld!", time);
      const duration = time - (await task.getActivationTime()).toNumber();
      const payment = ((price * duration) / wei).toString();
      await task.completeTask();
      task = taskContract.connect(client);
      await expect(
        task.completePayment({
          value: ethers.utils.parseEther(payment),
        })
      )
        .to.emit(task, "TransferMade")
        .withArgs(provider.address, ethers.utils.parseEther(payment));
    });

    it("emits a PaymentCompleted event", async function () {
      await registry.registerTask(task.address);
      task = taskContract.connect(provider);
      await task.activateTask({
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await task.receiveResults("Helloworld!", time);
      const duration = time - (await task.getActivationTime()).toNumber();
      const payment = ((price * duration) / wei).toString();
      await task.completeTask();
      task = taskContract.connect(client);
      await expect(
        task.completePayment({
          value: ethers.utils.parseEther(payment),
        })
      )
        .to.emit(task, "PaymentCompleted")
        .withArgs(taskID);
    });
  });

  describe("fallback", function () {
    it("reverts", async function () {
      await expect(
        deployer.sendTransaction({ to: task.address, data: "0x1234" })
      ).to.be.revertedWith("");
    });
  });

  describe("receive", function () {
    it("reverts with bad call", async function () {
      await expect(
        deployer.sendTransaction({ to: task.address, value: 1 })
      ).to.be.revertedWith("bad call");
    });
  });
});
