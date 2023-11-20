import { ethers } from "ethers";
import {
  IAuctionsManager,
  TCreateAuction,
  ActiveAuction,
  ProviderBid,
  Auction,
  CreatedAuction,
  CreatedAuctionEvent,
  CancelledAuctionEvent,
  CancelledAuction,
  BidAuction,
  BidAuctionEvent,
} from "./interface.js";
import {
  AuctionDeadlineHasPassedError,
  AuctionDoesNotExistError,
  AuctionNotInStateError,
  BidNotLowerThanCurrentBidError,
  ClientCannotBidError,
  NotCalledByClientError,
  TasksManagerNotSetError,
} from "./errors/index";
import { WithRetry } from "../decorator/retry";

//TODO
//add retries logic inside functions and errors too
//add gas metrics
export class AuctionsManager implements IAuctionsManager {
  private auctionsManagerContract: ethers.Contract;
  constructor(
    auctionsManagerAddress: string,
    auctionsManagerAbi: any,
    signer: ethers.Signer
  ) {
    this.auctionsManagerContract = new ethers.Contract(
      auctionsManagerAddress,
      auctionsManagerAbi,
      signer
    );
  }

  public async getSignerAddress(): Promise<string> {
    return await this.auctionsManagerContract.signer.getAddress();
  }

  /**
   * connects to the smart contract with the signer
   * @signer ethers.Signer | string | ethers.providers.Provider
   */
  public connect(
    signer: ethers.Signer | string | ethers.providers.Provider
  ): void {
    this.auctionsManagerContract = this.auctionsManagerContract.connect(signer);
  }

  public async setTasksManager(tasksManagerAddress: string): Promise<void> {
    const tx = await this.auctionsManagerContract.setTasksManager(
      tasksManagerAddress
    );
    const ret = tx.wait();
    return;
  }

  @WithRetry()
  public async createAuction({
    auctionDeadline,
    taskDeadline,
    clientVerification,
    code,
  }: TCreateAuction): Promise<CreatedAuction> {
    const tx = await this.auctionsManagerContract.createAuction(
      auctionDeadline,
      taskDeadline,
      clientVerification,
      code
    );
    const {
      to,
      from,
      contractAddress,
      gasUsed,
      blockHash,
      transactionHash,
      confirmations,
      cumulativeGasUsed,
      effectiveGasPrice,
      status,
      events,
    } = await tx.wait();
    const createdAuctionEvent: CreatedAuctionEvent = {
      name: events[0].event,
      auctionID: events[0].args.auctionID,
      client: events[0].args.client,
    };
    const createdAuction: CreatedAuction = {
      to,
      from,
      contractAddress,
      gasUsed: gasUsed.toNumber(),
      blockHash,
      transactionHash,
      confirmations,
      cumulativeGasUsed: cumulativeGasUsed.toNumber(),
      effectiveGasPrice: effectiveGasPrice.toNumber(),
      status,
      event: createdAuctionEvent,
    };
    return createdAuction;
  }

  @WithRetry()
  public async cancelAuction(auctionId: string): Promise<CancelledAuction> {
    try {
      const tx = await this.auctionsManagerContract.cancelAuction(auctionId);

      const {
        to,
        from,
        contractAddress,
        gasUsed,
        blockHash,
        transactionHash,
        confirmations,
        cumulativeGasUsed,
        effectiveGasPrice,
        status,
        events,
      } = await tx.wait();
      const cancelledAuctionEvent: CancelledAuctionEvent = {
        name: events[0].event,
        auctionID: events[0].args.auctionID,
        client: events[0].args.client,
      };
      const cancelledAuction: CancelledAuction = {
        to,
        from,
        contractAddress,
        gasUsed: gasUsed.toNumber(),
        blockHash,
        transactionHash,
        confirmations,
        cumulativeGasUsed: cumulativeGasUsed.toNumber(),
        effectiveGasPrice: effectiveGasPrice.toNumber(),
        status,
        event: cancelledAuctionEvent,
      };

      return cancelledAuction;
    } catch (e) {
      if (e.reason.includes("AuctionDoesNotExist")) {
        throw new AuctionDoesNotExistError();
      }
      if (e.reason.includes("NotCalledByClient")) {
        throw new NotCalledByClientError();
      }
      console.log(e);
      if (e.reason.includes("AuctionNotInState")) {
        console.error(e);
        // throw new AuctionNotInStateError();
      }
    }
  }

  @WithRetry()
  public async bid(auctionId: string, bid: number): Promise<BidAuction> {
    try {
      const tx = await this.auctionsManagerContract.bid(auctionId, bid);
      const {
        to,
        from,
        contractAddress,
        gasUsed,
        blockHash,
        transactionHash,
        confirmations,
        cumulativeGasUsed,
        effectiveGasPrice,
        status,
        events,
      } = await tx.wait();

      const bidAuctionEvent: BidAuctionEvent = {
        name: events[0].event,
        auctionID: events[0].args.auctionID,
        provider: events[0].args.provider,
        bid: events[0].args.bid.toNumber(),
      };

      const bidAuction: BidAuction = {
        to,
        from,
        contractAddress,
        gasUsed: gasUsed.toNumber(),
        blockHash,
        transactionHash,
        confirmations,
        cumulativeGasUsed: cumulativeGasUsed.toNumber(),
        effectiveGasPrice: effectiveGasPrice.toNumber(),
        status,
        event: bidAuctionEvent,
      };

      return bidAuction;
    } catch (e) {
      if (e.reason.includes("AuctionDoesNotExist")) {
        throw new AuctionDoesNotExistError();
      }
      if (e.reason.includes("AuctionNotInState")) {
        throw new AuctionNotInStateError();
      }
      if (e.reason.includes("TasksManagerNotSet")) {
        throw new TasksManagerNotSetError();
      }
      if (e.reason.includes("Client cannot bid")) {
        throw new ClientCannotBidError();
      }
      if (e.reason.includes("AuctionDeadlineHasPassed")) {
        throw new AuctionDeadlineHasPassedError();
      }
      if (e.reason.includes("BidNotLowerThanCurrentBid")) {
        throw new BidNotLowerThanCurrentBidError();
      }
    }
  }

  public async finalize(auctionId: string, provider: string): Promise<void> {
    const tx = await this.auctionsManagerContract.finalize(auctionId, provider);
    tx.wait();
    return tx;
  }

  public async getTasksManager(): Promise<string> {
    return await this.auctionsManagerContract.getTasksManager();
  }

  public async getOwner(): Promise<string> {
    return await this.auctionsManagerContract.owner();
  }

  public async getActiveAuctions(): Promise<ActiveAuction[]> {
    const activeAuctions =
      await this.auctionsManagerContract.getActiveAuctions();
    const auctions: ActiveAuction[] = activeAuctions.map(
      (activeAuction: any) => ({
        auction: {
          auctionID: activeAuction.auction.auctionID,
          client: activeAuction.auction.client,
          creationTime: activeAuction.auction.creationTime.toNumber(),
          auctionDeadline: activeAuction.auction.auctionDeadline.toNumber(),
          taskDeadline: activeAuction.auction.taskDeadline.toNumber(),
          clientVerification: activeAuction.auction.clientVerification,
          taskID: activeAuction.auction.taskID,
          code: activeAuction.auction.code,
          providerBids: activeAuction.auction.providerBids.map(
            (providerBid: any) => ({
              provider: providerBid.provider,
              bid: providerBid.bid.toNumber(),
              providerUpVotes: providerBid.providerUpVotes.toNumber(),
              providerDownVotes: providerBid.providerDownVotes.toNumber(),
            })
          ),
          winnerBid: {
            provider: activeAuction.auction.winnerBid.provider,
            bid: activeAuction.auction.winnerBid.bid.toNumber(),
          },
          auctionState: activeAuction.auction.auctionState,
        },
        clientUpVotes: activeAuction.clientUpVotes.toNumber(),
        clientDownVotes: activeAuction.clientDownVotes.toNumber(),
      })
    );
    return auctions;
  }

  public async getAuctionBids(auctionId: string): Promise<ProviderBid[]> {
    const auctionBids = await this.auctionsManagerContract.getAuctionBids(
      auctionId
    );
    return auctionBids.map((auctionBid: any) => ({
      provider: auctionBid.provider,
      bid: auctionBid.bid.toNumber(),
      providerUpVotes: auctionBid.providerUpVotes.toNumber(),
      providerDownVotes: auctionBid.providerDownVotes.toNumber(),
    }));
  }

  public async getAuctionsByClient(): Promise<Auction[]> {
    const auctionsByClient =
      await this.auctionsManagerContract.getAuctionsByClient();
    return auctionsByClient.map((auctionByClient: any) => ({
      auctionID: auctionByClient.auctionID,
      client: auctionByClient.client,
      creationTime: auctionByClient.creationTime,
      auctionDeadline: auctionByClient.auctionDeadline,
      taskDeadline: auctionByClient.taskDeadline,
      clientVerification: auctionByClient.clientVerification,
      taskID: auctionByClient.taskID,
      code: auctionByClient.code,
      providerBids: auctionByClient.providerBids.map((providerBid: any) => ({
        provider: providerBid.provider,
        bid: providerBid.bid,
        providerUpVotes: providerBid.providerUpVotes,
        providerDownVotes: providerBid.providerDownVotes,
      })),
      winnerBid: {
        provider: auctionByClient.winnerBid.provider,
        bid: auctionByClient.winnerBid.bid,
      },
      auctionState: auctionByClient.auctionState,
    }));
  }

  public async getAuctionWinnersByProvider(): Promise<Auction[]> {
    const auctionWinnersByProvider =
      await this.auctionsManagerContract.getAuctionWinnersByProvider();
    return auctionWinnersByProvider.map((auctionWinnerByProvider: any) => ({
      auctionID: auctionWinnerByProvider.auctionID,
      client: auctionWinnerByProvider.client,
      creationTime: auctionWinnerByProvider.creationTime,
      auctionDeadline: auctionWinnerByProvider.auctionDeadline,
      taskDeadline: auctionWinnerByProvider.taskDeadline,
      clientVerification: auctionWinnerByProvider.clientVerification,
      taskID: auctionWinnerByProvider.taskID,
      code: auctionWinnerByProvider.code,
      providerBids: auctionWinnerByProvider.providerBids.map(
        (providerBid: any) => ({
          provider: providerBid.provider,
          bid: providerBid.bid,
          providerUpVotes: providerBid.providerUpVotes,
          providerDownVotes: providerBid.providerDownVotes,
        })
      ),
      winnerBid: {
        provider: auctionWinnerByProvider.winnerBid.provider,
        bid: auctionWinnerByProvider.winnerBid.bid,
      },
      auctionState: auctionWinnerByProvider.auctionState,
    }));
  }

  public async getAuctionWinnersByClient(): Promise<Auction[]> {
    const auctionWinnersByClient =
      await this.auctionsManagerContract.getAuctionWinnersByClient();
    return auctionWinnersByClient.map((auctionWinnerByClient: any) => ({
      auctionID: auctionWinnerByClient.auctionID,
      client: auctionWinnerByClient.client,
      creationTime: auctionWinnerByClient.creationTime,
      auctionDeadline: auctionWinnerByClient.auctionDeadline,
      taskDeadline: auctionWinnerByClient.taskDeadline,
      clientVerification: auctionWinnerByClient.clientVerification,
      taskID: auctionWinnerByClient.taskID,
      code: auctionWinnerByClient.code,
      providerBids: auctionWinnerByClient.providerBids.map(
        (providerBid: any) => ({
          provider: providerBid.provider,
          bid: providerBid.bid,
          providerUpVotes: providerBid.providerUpVotes,
          providerDownVotes: providerBid.providerDownVotes,
        })
      ),
      winnerBid: {
        provider: auctionWinnerByClient.winnerBid.provider,
        bid: auctionWinnerByClient.winnerBid.bid,
      },
      auctionState: auctionWinnerByClient.auctionState,
    }));
  }

  public async getAuctionActiveBidsByProvider(): Promise<Auction[]> {
    const auctionActiveBidsByProvider =
      await this.auctionsManagerContract.getAuctionActiveBidsByProvider();
    return auctionActiveBidsByProvider.map(
      (auctionActiveBidByProvider: any) => ({
        auctionID: auctionActiveBidByProvider.auctionID,
        client: auctionActiveBidByProvider.client,
        creationTime: auctionActiveBidByProvider.creationTime,
        auctionDeadline: auctionActiveBidByProvider.auctionDeadline,
        taskDeadline: auctionActiveBidByProvider.taskDeadline,
        clientVerification: auctionActiveBidByProvider.clientVerification,
        taskID: auctionActiveBidByProvider.taskID,
        code: auctionActiveBidByProvider.code,
        providerBids: auctionActiveBidByProvider.providerBids.map(
          (providerBid: any) => ({
            provider: providerBid.provider,
            bid: providerBid.bid,
            providerUpVotes: providerBid.providerUpVotes,
            providerDownVotes: providerBid.providerDownVotes,
          })
        ),
        winnerBid: {
          provider: auctionActiveBidByProvider.winnerBid.provider,
          bid: auctionActiveBidByProvider.winnerBid.bid,
        },
        auctionState: auctionActiveBidByProvider.auctionState,
      })
    );
  }
}
