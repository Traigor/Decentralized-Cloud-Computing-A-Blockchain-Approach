import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments, tasks } from "hardhat";
import { TasksManagerGasTest } from "../typechain-types";
import { BigNumber } from "ethers";

describe("TasksManagerGasTest Unit Tests", function () {
  let tasksManager: TasksManagerGasTest;
  let tasksManagerContract: TasksManagerGasTest;
  let deployer: SignerWithAddress;
  let provider: SignerWithAddress;
  let client: SignerWithAddress;
  let otherAccounts: SignerWithAddress[];
  let taskID: string;
  let price: number;
  let wei: number;
  let providerCollateral: number;
  let clientCollateral: number;
  let deadline: number;
  let clientVerification: string;
  let verificationCode: string;
  let computationCode: string;
  let clientCollateralValue: BigNumber;
  let providerCollateralValue: BigNumber;

  beforeEach(async function () {
    [deployer, client, provider, ...otherAccounts] = await ethers.getSigners();
    await deployments.fixture(["tasksManagerGasTest"]);
    tasksManagerContract = await ethers.getContract("TasksManagerGasTest");
    tasksManager = tasksManagerContract.connect(deployer);

    taskID =
      "0xaaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff";
    price = 30;
    providerCollateral = price * 10;
    clientCollateral = price * 2;
    deadline = 600;
    clientVerification =
      "0xf2350a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4da";
    verificationCode = "verificationIPFS";
    computationCode = "computationIPFS";
    wei = 1000000000000000000;
    clientCollateralValue = ethers.utils.parseEther(
      (clientCollateral / wei).toFixed(18).toString()
    );
    providerCollateralValue = ethers.utils.parseEther(
      (providerCollateral / wei).toFixed(18).toString()
    );
  });

  describe("constructor", function () {
    it("initializes the registry and sets the owner", async function () {
      const owner = await tasksManager.getOwner();
      expect(owner).to.equal(deployer.address);
    });
  });

  describe("createTask", function () {
    it("createTask is successful", async function () {
      //add comments about events etc
      tasksManager = tasksManagerContract.connect(client);
      const createdTask = (
        await tasksManager.createTask(
          taskID,
          provider.address,
          price,
          deadline,
          clientVerification,
          verificationCode,
          computationCode,
          {
            value: clientCollateralValue,
          }
        )
      ).wait();
      const events = (await createdTask).events as unknown as Event[];
      tasksManager = tasksManagerContract.connect(deployer);
      const taskCreated = await tasksManager.getTask(taskID);
      expect(taskCreated.client).to.equal(client.address);
      expect(taskCreated.provider).to.equal(provider.address);
      expect(taskCreated.providerCollateral).to.equal(providerCollateral);
      expect(taskCreated.clientCollateral).to.equal(clientCollateral);
      expect(taskCreated.deadline).to.equal(deadline);
      expect(taskCreated.price).to.equal(price);
      expect(taskCreated.duration).to.equal(0);
      expect(taskCreated.cost).to.equal(0);
      expect(taskCreated.activationTime).to.equal(0);
      expect(taskCreated.timeResultProvided).to.equal(0);
      expect(taskCreated.timeResultReceived).to.equal(0);
      expect(taskCreated.verificationCode).to.equal(verificationCode);
      expect(taskCreated.computationCode).to.equal(computationCode);
      expect(taskCreated.results).to.equal("");
      expect(taskCreated.clientVerification).to.equal(clientVerification);
      expect(taskCreated.taskState).to.equal(0);
      expect(taskCreated.paymentState).to.equal(0);
      expect(events[0].event).to.equal("TaskCreated"); //it works
      expect(events[0].args.taskID).to.equal(taskID); //it works
    });
  });

  describe("activateTask", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the provider", async function () {
      await expect(tasksManager.activateTask(taskID)).to.be.revertedWith(
        "Error__ProviderOnly"
      );
    });

    it("reverts if value sent is not the expected", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(
        tasksManager.activateTask(taskID, {
          value: ethers.utils.parseEther("0.00000000000000004"),
        })
      ).to.be.revertedWith("Provider collateral is not enough");
    });

    it("reverts if task is not in state Created", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      await expect(
        tasksManager.activateTask(taskID, {
          value: providerCollateralValue,
        })
      ).to.be.revertedWith("Error__TaskState");
    });

    it("activateTask is successful", async function () {
      //emits a TaskActivated event
      tasksManager = tasksManagerContract.connect(provider);
      const currentDate = Math.floor(Date.now() / 1000);
      const activatedTask = (
        await tasksManager.activateTask(taskID, {
          value: providerCollateralValue,
        })
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const activationTime = await tasksManager.getActivationTime(taskID);
      const events = (await activatedTask).events as unknown as Event[];
      expect(taskState).to.equal("Active");
      expect(paymentState).to.equal("Initialized");
      expect(events[0].event).to.equal("TaskActivated");
      expect(events[0].args.taskID).to.equal(taskID);
      expect(activationTime.toNumber()).to.be.closeTo(currentDate, 10);
      //Below i increase the time to check if the task is expired
      //if i have ran the test once, the node will need reset for the next test
    });
  });

  describe("sendResults", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the provider", async function () {
      await expect(
        tasksManager.sendResults(taskID, "ipfsCID")
      ).to.be.revertedWith("Error__ProviderOnly");
    });
    it("reverts if task is not in state CompletedSuccessfully", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(
        tasksManager.sendResults(taskID, "ipfsCID")
      ).to.be.revertedWith("Error__TaskState");
    });
    it("sendResults is successful, cost is lower than clientCollateral", async function () {
      //checks task state
      //checks payment state
      //checks upVotes
      //emits a TransferMadeToProvider event
      //emits a TransferMadeToClient event
      //emits a PaymentCompleted event
      //emits a ProviderUpvoted event
      //emits a TaskReceivedResultsSuccessfully event
      const duration = 2;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const previousUpVotes = (
        await tasksManager.getPerformance(provider.address)
      ).upVotes.toNumber();
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      const receivedResults = (
        await tasksManager.sendResults(taskID, "ipfsCID")
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await receivedResults).events as unknown as Event[];
      const currentUpVotes = (
        await tasksManager.getPerformance(provider.address)
      ).upVotes.toNumber();
      expect(taskState).to.equal("ResultsReceivedSuccessfully");
      expect(paymentState).to.equal("Completed");
      expect(currentUpVotes).to.equal(previousUpVotes + 1);
      expect(events[0].event).to.equal("TransferMadeToProvider");
      expect(events[0].args.provider).to.equal(provider.address);
      expect(events[0].args.amount).to.equal(
        price * duration + providerCollateral
      );
      expect(events[1].event).to.equal("TransferMadeToClient");
      expect(events[1].args.client).to.equal(client.address);
      expect(events[1].args.amount).to.equal(
        price * duration - clientCollateral
      );
      expect(events[2].event).to.equal("PaymentCompleted");
      expect(events[2].args.taskID).to.equal(taskID);
      expect(events[3].event).to.equal("TaskReceivedResultsSuccessfully");
      expect(events[3].args.taskID).to.equal(taskID);
      expect(events[4].event).to.equal("ProviderUpvoted");
      expect(events[4].args.provider).to.equal(provider.address);
      expect(events[4].args.taskID).to.equal(taskID);
    });

    it("sendResults is successful, cost is greater than clientCollateral", async function () {
      //checks task state
      //checks payment state
      //checks upVotes
      //emits a TransferMadeToProvider event
      //emits a PaymentPending event
      //emits a ProviderUpvoted event
      //emits a TaskReceivedResultsSuccessfully event
      const duration = 10;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const previousUpVotes = (
        await tasksManager.getPerformance(provider.address)
      ).upVotes.toNumber();
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      const receivedResults = (
        await tasksManager.sendResults(taskID, "ipfsCID")
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await receivedResults).events as unknown as Event[];
      const currentUpVotes = (
        await tasksManager.getPerformance(provider.address)
      ).upVotes.toNumber();
      expect(taskState).to.equal("ResultsReceivedSuccessfully");
      expect(paymentState).to.equal("Pending");
      expect(currentUpVotes).to.equal(previousUpVotes + 1);
      expect(events[0].event).to.equal("TransferMadeToProvider");
      expect(events[0].args.provider).to.equal(provider.address);
      expect(events[0].args.amount).to.equal(
        clientCollateral + providerCollateral
      );
      expect(events[1].event).to.equal("PaymentPending");
      expect(events[1].args.taskID).to.equal(taskID);
      expect(events[2].event).to.equal("TaskReceivedResultsSuccessfully");
      expect(events[2].args.taskID).to.equal(taskID);
      expect(events[3].event).to.equal("ProviderUpvoted");
      expect(events[3].args.provider).to.equal(provider.address);
      expect(events[3].args.taskID).to.equal(taskID);
    });

    it("sendResults is unsuccessful", async function () {
      //checks task state
      //checks payment state
      //checks downVotes
      //emits a TransferMadeToClient event
      //emits a ProviderDownvoted event
      //emits a TaskReceivedResultsUnsuccessfully event
      const duration = 1;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const previousDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).upVotes.toNumber();
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        Math.floor(Date.now() / 1000) //this is 1 or 2 seconds lower than the activation time
      );
      const receivedResults = (
        await tasksManager.sendResults(taskID, "ipfsCID")
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await receivedResults).events as unknown as Event[];
      const currentDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).downVotes.toNumber();
      expect(taskState).to.equal("ResultsReceivedUnsuccessfully");
      expect(paymentState).to.equal("Initialized");
      expect(currentDownVotes).to.equal(previousDownVotes + 1);
      expect(events[0].event).to.equal("TransferMadeToClient");
      expect(events[0].args.client).to.equal(client.address);
      expect(events[0].args.amount).to.equal(
        clientCollateral + providerCollateral
      );
      expect(events[1].event).to.equal("TaskReceivedResultsUnsuccessfully");
      expect(events[1].args.taskID).to.equal(taskID);
      expect(events[2].event).to.equal("ProviderDownvoted");
      expect(events[2].args.provider).to.equal(provider.address);
      expect(events[2].args.taskID).to.equal(taskID);
    });
  });

  describe("completeTask", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });

    it("reverts if not called by the provider", async function () {
      await expect(
        tasksManager.completeTask(
          taskID,
          "Helloworld!",
          10,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Error__ProviderOnly");
    });

    it("reverts if task is not in state Active", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(
        tasksManager.completeTask(
          taskID,
          "Helloworld!",
          10,
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Error__TaskState");
    });

    it("completeTask is successful", async function () {
      //emits a TaskCompletedSuccessfully event
      //checks tasks state
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const completedTask = (
        await tasksManager.completeTask(
          taskID,
          "Helloworld!",
          10,
          Math.floor(Date.now() / 1000)
        )
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);

      const events = (await completedTask).events as unknown as Event[];
      expect(taskState).to.equal("CompletedSuccessfully");
      expect(paymentState).to.equal("Initialized");
      expect(events[0].event).to.equal("TaskCompletedSuccessfully");
      expect(events[0].args.taskID).to.equal(taskID);
    });
    it("completeTask is unsuccessful, because of false verification", async function () {
      //checks task state
      //checks downvotes
      //emits TransferMadeToClient event
      //emits TaskCompletedUnsuccessfully event
      //emits ProviderDownvoted event
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const previousDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).downVotes.toNumber();
      const completedTask = (
        await tasksManager.completeTask(
          taskID,
          "Helloworld!(wrong!)",
          10,
          Math.floor(Date.now() / 1000)
        )
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await completedTask).events as unknown as Event[];
      const currentDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).downVotes.toNumber();
      expect(taskState).to.equal("CompletedUnsuccessfully");
      expect(paymentState).to.equal("Initialized");
      expect(currentDownVotes).to.equal(previousDownVotes + 1);
      expect(events[0].event).to.equal("TransferMadeToClient");
      expect(events[0].args.client).to.equal(client.address);
      expect(events[0].args.amount).to.equal(
        clientCollateral + providerCollateral
      );
      expect(events[1].event).to.equal("ProviderDownvoted");
      expect(events[1].args.provider).to.equal(provider.address);
      expect(events[1].args.taskID).to.equal(taskID);
      expect(events[2].event).to.equal("TaskCompletedUnsuccessfully");
      expect(events[2].args.taskID).to.equal(taskID);
    });

    it("completeTask is unsuccessful, because of time", async function () {
      //checks task state
      //checks downvotes
      //emits TransferMadeToClient event
      //emits TaskCompletedUnsuccessfully event
      //emits ProviderDownvoted event
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const previousDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).downVotes.toNumber();
      await ethers.provider.send("evm_increaseTime", [601]);
      const completedTask = (
        await tasksManager.completeTask(
          taskID,
          "Helloworld!(wrong!)",
          10,
          Math.floor(Date.now() / 1000) + 601
        )
      ).wait();
      const taskState = await tasksManager.getTaskState(taskID);
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await completedTask).events as unknown as Event[];
      const currentDownVotes = (
        await tasksManager.getPerformance(provider.address)
      ).downVotes.toNumber();
      expect(taskState).to.equal("CompletedUnsuccessfully");
      expect(paymentState).to.equal("Initialized");
      expect(currentDownVotes).to.equal(previousDownVotes + 1);
      expect(events[0].event).to.equal("TransferMadeToClient");
      expect(events[0].args.client).to.equal(client.address);
      expect(events[0].args.amount).to.equal(
        clientCollateral + providerCollateral
      );
      expect(events[1].event).to.equal("ProviderDownvoted");
      expect(events[1].args.provider).to.equal(provider.address);
      expect(events[1].args.taskID).to.equal(taskID);
      expect(events[2].event).to.equal("TaskCompletedUnsuccessfully");
      expect(events[2].args.taskID).to.equal(taskID);
    });
  });

  describe("completePayment", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the client", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(tasksManager.completePayment(taskID)).to.be.revertedWith(
        "Error__ClientOnly"
      );
    });
    it("reverts if task is not in state ResultsReceivedSuccessfully", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.completePayment(taskID)).to.be.revertedWith(
        "Error__TaskState"
      );
    });
    it("reverts if value sent is not the expected", async function () {
      const duration = 10;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      await tasksManager.sendResults(taskID, "ipfsCID");
      tasksManager = tasksManagerContract.connect(client);
      await expect(
        tasksManager.completePayment(taskID, {
          value: ethers.utils.parseEther("0.0000000000000004"),
        })
      ).to.be.revertedWith("Error__WrongValue");
    });
    it("completePayment is successful", async function () {
      //checks payment state
      //emits TransferMadeToProvider event
      //emits PaymentCompleted event
      const duration = 10;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      await tasksManager.sendResults(taskID, "ipfsCID");
      const payment = price * duration - clientCollateral;
      const paymentValue = ethers.utils.parseEther(
        (payment / wei).toFixed(18).toString()
      );
      tasksManager = tasksManagerContract.connect(client);
      const completedPayment = (
        await tasksManager.completePayment(taskID, {
          value: paymentValue,
        })
      ).wait();
      const paymentState = await tasksManager.getPaymentState(taskID);
      const events = (await completedPayment).events as unknown as Event[];
      expect(paymentState).to.equal("Completed");
      expect(events[0].event).to.equal("TransferMadeToProvider");
      expect(events[0].args.provider).to.equal(provider.address);
      expect(events[0].args.amount).to.equal(payment);
      expect(events[1].event).to.equal("PaymentCompleted");
      expect(events[1].args.taskID).to.equal(taskID);
    });
  });

  describe("getResults", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the client", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await expect(tasksManager.getResults(taskID)).to.be.revertedWith(
        "Error__ClientOnly"
      );
    });
    it("reverts if task is not in state ResultsReceivedSuccessfully", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.getResults(taskID)).to.be.revertedWith(
        "Error__TaskState"
      );
    });
    it("reverts if payment is not in state Completed", async function () {
      const duration = 10;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      await tasksManager.sendResults(taskID, "ipfsCID");
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.getResults(taskID)).to.be.revertedWith(
        "Error__PaymentState"
      );
    });
    it("getResults is successful", async function () {
      const duration = 10;
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      await tasksManager.sendResults(taskID, "ipfsCID");
      const payment = price * duration - clientCollateral;
      const paymentValue = ethers.utils.parseEther(
        (payment / wei).toFixed(18).toString()
      );
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.completePayment(taskID, {
        value: paymentValue,
      });
      const results = await tasksManager.getResults(taskID);
      expect(results).to.equal("ipfsCID");
    });
  });

  describe("invalidateTask", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the client", async function () {
      tasksManager = tasksManagerContract.connect(deployer);
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Error__ClientOnly"
      );
    });

    it("reverts if task is not in state Active", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Error__TaskState"
      );
    });

    it("reverts if time has not expired", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.invalidateTask(taskID)).to.be.revertedWith(
        "Time has not expired."
      );
    });

    it("invalidateTask is successful", async function () {
      //emits a TransferMadeToClient event
      //emits a TaskInvalidated event
      //UnregisterTask is successful - not yet
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      const invalidatedTask = (
        await tasksManager.invalidateTask(taskID)
      ).wait();
      const events = (await invalidatedTask).events as unknown as Event[];
      tasksManager = tasksManagerContract.connect(deployer);
      expect(events[0].event).to.equal("TransferMadeToClient");
      expect(events[0].args.client).to.equal(client.address);
      expect(events[0].args.amount).to.equal(
        ethers.utils.parseEther(
          ((clientCollateral + providerCollateral) / wei).toFixed(18).toString()
        )
      );
      expect(events[1].event).to.equal("TaskInvalidated");
      expect(events[1].args.taskID).to.equal(taskID);
      // expect(await tasksManager.isRegistered(taskID)).to.equal(false);
    });
  });

  describe("cancelTask", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });
    it("reverts if not called by the client", async function () {
      tasksManager = tasksManagerContract.connect(deployer);
      await expect(tasksManager.cancelTask(taskID)).to.be.revertedWith(
        "Error__ClientOnly"
      );
    });
    it("reverts if task is not in state Created", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: ethers.utils.parseEther("0.0000000000000005"),
      });
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.cancelTask(taskID)).to.be.revertedWith(
        "Error__TaskState"
      );
    });
    it("cancelTask is successful", async function () {
      //emits a TransferMade event
      //emits a TaskCancelled event
      tasksManager = tasksManagerContract.connect(client);
      const cancelledTask = (await tasksManager.cancelTask(taskID)).wait();
      const events = (await cancelledTask).events as unknown as Event[];
      expect(events[0].event).to.equal("TransferMadeToClient");
      expect(events[0].args.client).to.equal(client.address);
      expect(events[0].args.amount).to.equal(clientCollateralValue);
      expect(events[1].event).to.equal("TaskCancelled");
      expect(events[1].args.taskID).to.equal(taskID);
    });
  });

  describe("deleteTask", function () {
    it("reverts if not called by the owner", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.deleteTask(taskID)).to.be.revertedWith(
        "Error__OwnerOnly"
      );
    });
    it("deleteTask is successful", async function () {
      //deletes task
      //emits a TaskDeleted event
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const deletedTask = (await tasksManager.deleteTask(taskID)).wait();
      const events = (await deletedTask).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });
  });

  describe("deleteTasks", function () {
    beforeEach(async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.createTask(
        taskID,
        provider.address,
        price,
        deadline,
        clientVerification,
        verificationCode,
        computationCode,
        {
          value: clientCollateralValue,
        }
      );
    });

    it("reverts if not called by the owner", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await expect(tasksManager.deleteTasks()).to.be.revertedWith(
        "Error__OwnerOnly"
      );
    });

    it("deleteTasks is successful, task in state ResultsReceivedSuccessfully and payment in state Completed", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      const duration = 10;
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await ethers.provider.send("evm_increaseTime", [duration]);
      await tasksManager.sendResults(taskID, "ipfsCID");
      const payment = price * 10 - clientCollateral;
      const paymentValue = ethers.utils.parseEther(
        (payment / wei).toFixed(18).toString()
      );
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.completePayment(taskID, {
        value: paymentValue,
      });
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      await ethers.provider.send("evm_increaseTime", [61]); //to be changed in smart contract
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });

    it("deleteTasks is successful, task in state ResultsReceivedUnsuccessfully", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      const duration = 10;
      await tasksManager.completeTask(
        taskID,
        "Helloworld!",
        duration,
        activationTime + duration
      );
      await tasksManager.sendResults(taskID, "ipfsCID");
      const payment = price * 10 - clientCollateral;
      const paymentValue = ethers.utils.parseEther(
        (payment / wei).toFixed(18).toString()
      );
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      await ethers.provider.send("evm_increaseTime", [61]); //to be changed in smart contract
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });

    it("deleteTasks is successful, task in state CompletedUnsuccessfully", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      const activationTime = (
        await tasksManager.getActivationTime(taskID)
      ).toNumber();
      const duration = 10;
      await tasksManager.completeTask(
        taskID,
        "Helloworld!(wrong!)",
        duration,
        activationTime + duration
      );
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      await ethers.provider.send("evm_increaseTime", [61]); //to be changed in smart contract
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });

    it("deleteTasks is successful, task in state Cancelled", async function () {
      tasksManager = tasksManagerContract.connect(client);
      await tasksManager.cancelTask(taskID);
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      await ethers.provider.send("evm_increaseTime", [61]); //to be changed in smart contract
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });

    it("deleteTasks is successful, task in state Invalid", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await tasksManager.invalidateTask(taskID);
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      await ethers.provider.send("evm_increaseTime", [61]); //to be changed in smart contract
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(false);
      expect(currentActiveTasks).to.equal(previousActiveTasks - 1);
      expect(events[0].event).to.equal("TaskDeleted");
      expect(events[0].args.taskID).to.equal(taskID);
    });

    it("deleteTasks is unsuccessful, time has not passed", async function () {
      tasksManager = tasksManagerContract.connect(provider);
      await tasksManager.activateTask(taskID, {
        value: providerCollateralValue,
      });
      tasksManager = tasksManagerContract.connect(client);
      await ethers.provider.send("evm_increaseTime", [601]);
      await tasksManager.invalidateTask(taskID);
      tasksManager = tasksManagerContract.connect(deployer);
      const previousActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const deletedTasks = (await tasksManager.deleteTasks()).wait();
      const events = (await deletedTasks).events as unknown as Event[];
      const currentActiveTasks = (
        await tasksManager.getActiveTasks()
      ).toNumber();
      const isRegistered = await tasksManager.isRegistered(taskID);
      expect(isRegistered).to.equal(true);
      expect(currentActiveTasks).to.equal(previousActiveTasks);
    });
  });

  describe("fallback", function () {
    it("reverts", async function () {
      await expect(
        deployer.sendTransaction({ to: tasksManager.address, data: "0x1234" })
      ).to.be.reverted;
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
