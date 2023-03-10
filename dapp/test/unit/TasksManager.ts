import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { task } from "hardhat/config";
import { TasksManager } from "../../typechain-types";

describe("TasksManager Unit Tests", function () {
  let tasksManager: TasksManager;
  let tasksManagerContract: TasksManager;
  let deployer: SignerWithAddress;
  let provider: SignerWithAddress;
  let client: SignerWithAddress;
  let otherAccounts: SignerWithAddress[];
  let taskID: string;
  let price: number;
  let wei: number;
  let providerCollateral: number;
  let deadline: number;
  let clientVerification: string;

  beforeEach(async function () {
    [deployer, client, provider, ...otherAccounts] = await ethers.getSigners();
    await deployments.fixture(["tasksManager"]);
    tasksManagerContract = await ethers.getContract("TasksManager");
    tasksManager = tasksManagerContract.connect(deployer);

    taskID =
      "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
    price = 30;
    providerCollateral = 500;
    deadline = 600;
    clientVerification =
      "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
    wei = 1000000000000000000;
  });

  describe("constructor", function () {
    it("initializes the registry and sets the owner", async function () {
      const owner = await tasksManager.getOwner();
      expect(owner).to.equal(deployer.address);
    });
  });

  describe("createTask", function () {
    it("createTask is successful", async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
      const taskCreated = await tasksManager.getTask(taskID);
      expect(taskCreated.client).to.equal(client.address);
      expect(taskCreated.provider).to.equal(provider.address);
      expect(taskCreated.price).to.equal(price);
      expect(taskCreated.providerCollateral).to.equal(providerCollateral);
      expect(taskCreated.deadline).to.equal(deadline);
      expect(taskCreated.clientVerification).to.equal(clientVerification);
      expect(taskCreated.payment).to.equal(0);
      expect(taskCreated.duration).to.equal(0);
      expect(taskCreated.activationTime).to.equal(0);
      expect(taskCreated.timeResultProvided).to.equal(0);
      expect(taskCreated.timeResultReceived).to.equal(0);
      expect(taskCreated.providerVerification).to.equal("");
      expect(taskCreated.taskState).to.equal(0);
      expect(taskCreated.paymentState).to.equal(0);
    });

    it("emits a TaskCreated event", async function () {
      await expect(
        tasksManager.createTask(
          taskID,
          client.address,
          provider.address,
          price,
          providerCollateral,
          deadline,
          clientVerification
        )
      )
        .to.emit(tasksManager, "TaskCreated")
        .withArgs(taskID);
    });

    it("emits a TaskRegistered event", async function () {
      await expect(
        tasksManager.createTask(
          taskID,
          client.address,
          provider.address,
          price,
          providerCollateral,
          deadline,
          clientVerification
        )
      )
        .to.emit(tasksManager, "TaskRegistered")
        .withArgs(taskID);
    });
  });

  describe("cancelTask", function () {
    beforeEach(async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
    });
    it("reverts if not called by the client", async function () {
      await expect(tasksManager.cancelTask(taskID)).to.be.revertedWith(
        "Method can be called only by client."
      );
    });
    it("reverts if task is not in state Created", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.cancelTask(taskID)).to.be.revertedWith(
        "Invalid TaskState."
      );
    });
    it("balance is correct", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.cancelTask(taskID);
      const balance = await ethers.provider.getBalance(tasksManager.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });
    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.cancelTask(taskID))
        .to.emit(tasksManager, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther("0"));
    });
    it("emits a TaskCancelled event", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.cancelTask(taskID))
        .to.emit(tasksManager, "TaskCancelled")
        .withArgs(taskID);
    });
    it("emits a TaskUnregistered event", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.cancelTask(taskID))
        .to.emit(tasksManager, "TaskUnregistered")
        .withArgs(taskID);
    });
  });

  describe("activateTask", function () {
    beforeEach(async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
    });
    it("reverts if not called by the provider", async function () {
      await expect(tasksManager.activateTask(taskID)).to.be.revertedWith(
        "Method can be called only by provider."
      );
    });

    it("reverts if value sent is not the expected", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(
        tasksManager.activateTask(taskID, {
          value: ethers.utils.parseEther("0.0000000000000004"),
        })
      ).to.be.revertedWith("Value sent is not the expected");
    });

    it("reverts if task is not in state Created", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await expect(
        tasksManager.activateTask(taskID, {
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      ).to.be.revertedWith("Invalid TaskState.");
    });

    it("activateTask is successful", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      expect(taskState).to.equal(2);
      expect(paymentState).to.equal(0);
      //TODO: add activationTime check
    });

    it("balance is correct", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const balance = await ethers.provider.getBalance(tasksManager.address);
      const amount = (
        (await tasksManager.getProviderCollateral(taskID)).toNumber() / wei
      ).toFixed(18);
      expect(balance).to.equal(ethers.utils.parseEther(amount.toString()));
    });

    it("emits a TaskActivated event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(
        tasksManager.activateTask(taskID, {
          value: ethers.utils.parseEther("0.0000000000000005"),
        })
      )
        .to.emit(tasksManager, "TaskActivated")
        .withArgs(taskID); //TODO: get TaskID from the contract
    });
  });

  describe("invalidateTask", function () {
    beforeEach(async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
    });
    it("reverts if not called by the client", async function () {
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Method can be called only by client."
      );
    });

    it("reverts if task is not in state Active", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Invalid TaskState."
      );
    });

    it("reverts if time has not expired", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Time has not expired."
      );
    });

    it("balance is correct", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await tasksManager.invalidateTask(taskID);
      const balance = await ethers.provider.getBalance(tasksManager.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      const amount = (
        (await tasksManager.getProviderCollateral(taskID)).toNumber() / wei
      ).toFixed(18);
      await expect(tasksManager.invalidateTask(taskID))
        .to.emit(tasksManager, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });

    it("unregisterTask is successful", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await tasksManager.invalidateTask(taskID);
      const isRegistered = await tasksManager.isRegistered(taskID);
      await expect(isRegistered).to.equal(false);
    });

    it("emits a TaskInvalidated event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await expect(tasksManager.invalidateTask(taskID))
        .to.emit(tasksManager, "TaskInvalidated")
        .withArgs(taskID);
    });
  });

  describe("completeTask", function () {
    beforeEach(async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
    });
    it("reverts if not called by the provider", async function () {
      await expect(tasksManager.completeTask(taskID)).to.be.revertedWith(
        "Method can be called only by provider."
      );
    });
    it("reverts if task is not in state Active", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(tasksManager.completeTask(taskID)).to.be.revertedWith(
        "Invalid TaskState."
      );
    });
    it("completeTask is successful, correct verification and in time", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "Helloworld!", Date.now());
      await tasksManager.completeTask(taskID);
      const balance = await ethers.provider.getBalance(tasksManager.address);
      const paymentState = await tasksManager.getPaymentState(taskID);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
      expect(paymentState).to.equal(1);
    });
    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "Helloworld!", Date.now());
      const amount = (
        (await tasksManager.getProviderCollateral(taskID)).toNumber() / wei
      ).toFixed(18);
      await expect(tasksManager.completeTask(taskID))
        .to.emit(tasksManager, "TransferMade")
        .withArgs(provider.address, ethers.utils.parseEther(amount.toString()));
    });
    it("emits a PaymentPending event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await tasksManager.receiveResults(taskID, "Helloworld!", time);
      const duration =
        time - (await tasksManager.getActivationTime(taskID)).toNumber();
      const payment = ((price * duration) / wei).toString();
      await expect(tasksManager.completeTask(taskID))
        .to.emit(tasksManager, "PaymentPending")
        .withArgs(taskID, ethers.utils.parseEther(payment));
    });
    it("emits a TaskCompleted event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "Helloworld!", Date.now());
      await expect(tasksManager.completeTask(taskID))
        .to.emit(tasksManager, "TaskCompleted")
        .withArgs(taskID);
    });
    it("completeTask is successful, false verification and in time", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "HelloWorld!", Date.now());
      await tasksManager.completeTask(taskID);
      const balance = await ethers.provider.getBalance(tasksManager.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "HelloWorld!", Date.now());
      const amount = (
        (await tasksManager.getProviderCollateral(taskID)).toNumber() / wei
      ).toFixed(18);
      await expect(tasksManager.completeTask(taskID))
        .to.emit(tasksManager, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });

    it("completeTask is successful, correct verification and out of time", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await ethers.provider.send("evm_increaseTime", [601]);
      await tasksManager.receiveResults(taskID, "Helloworld!", Date.now());
      await tasksManager.completeTask(taskID);
      const balance = await ethers.provider.getBalance(tasksManager.address);
      expect(balance).to.equal(ethers.utils.parseEther("0"));
    });

    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "HelloWorld!", Date.now());
      const amount = (
        (await tasksManager.getProviderCollateral(taskID)).toNumber() / wei
      ).toFixed(18);
      await expect(tasksManager.completeTask(taskID))
        .to.emit(tasksManager, "TransferMade")
        .withArgs(client.address, ethers.utils.parseEther(amount.toString()));
    });
  });

  describe("completePayment", function () {
    beforeEach(async function () {
      await tasksManager.createTask(
        taskID,
        client.address,
        provider.address,
        price,
        providerCollateral,
        deadline,
        clientVerification
      );
    });
    it("reverts if not called by the client", async function () {
      await expect(tasksManager.completePayment(taskID)).to.be.revertedWith(
        "Method can be called only by client."
      );
    });
    it("reverts if task is not in state Completed", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.completePayment(taskID)).to.be.revertedWith(
        "Invalid TaskState."
      );
    });
    it("reverts if value sent is not the expected", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      await tasksManager.receiveResults(taskID, "Helloworld!", Date.now());
      await tasksManager.completeTask(taskID);
      tasksManager = tasksManagerContract.connect(client);
      await expect(
        tasksManager.completePayment(taskID, {
          value: ethers.utils.parseEther("0.0000000000000004"),
        })
      ).to.be.revertedWith("Value sent is not the expected");
    });
    it("emits a TransferMade event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await tasksManager.receiveResults(taskID, "Helloworld!", time);
      const duration =
        time - (await tasksManager.getActivationTime(taskID)).toNumber();
      const payment = ((price * duration) / wei).toString();
      await tasksManager.completeTask(taskID);
      tasksManager = tasksManagerContract.connect(client);
      await expect(
        tasksManager.completePayment(taskID, {
          value: ethers.utils.parseEther(payment),
        })
      )
        .to.emit(tasksManager, "TransferMade")
        .withArgs(provider.address, ethers.utils.parseEther(payment));
    });

    it("emits a PaymentCompleted event", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      const time = Date.now();
      await tasksManager.receiveResults(taskID, "Helloworld!", time);
      const duration =
        time - (await tasksManager.getActivationTime(taskID)).toNumber();
      const payment = ((price * duration) / wei).toString();
      await tasksManager.completeTask(taskID);
      tasksManager = tasksManagerContract.connect(client);
      await expect(
        tasksManager.completePayment(taskID, {
          value: ethers.utils.parseEther(payment),
        })
      )
        .to.emit(tasksManager, "PaymentCompleted")
        .withArgs(taskID);
    });
  });
  describe("fallback", function () {
    it("reverts", async function () {
      await expect(
        deployer.sendTransaction({ to: tasksManager.address, data: "0x1234" })
      ).to.be.revertedWith("");
    });
  });

  describe("receive", function () {
    it("reverts with bad call", async function () {
      await expect(
        deployer.sendTransaction({ to: tasksManager.address, value: 1 })
      ).to.be.revertedWith("bad call");
    });
  });
});
