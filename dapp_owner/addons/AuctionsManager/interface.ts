export type TCreateAuction = {
  auctionDeadline: number;
  taskDeadline: number;
  clientVerification: string;
  code: string;
};

export enum AuctionState {
  Created,
  Cancelled,
  Finalized,
}

export enum AuctionStateLabels {
  Created = "Created",
  Cancelled = "Cancelled",
  Finalized = "Finalized",
}

export type WinnerBid = {
  provider: string;
  bid: number;
};

export type Auction = {
  auctionID: string;
  client: string;
  creationTime: number;
  auctionDeadline: number;
  taskDeadline: number;
  clientVerification: string;
  taskID: string;
  code: string;
  providerBids: ProviderBid[];
  winnerBid: WinnerBid;
  auctionState: AuctionState;
};

export type ProviderBid = {
  provider: string;
  bid: number;
  providerUpVotes: number;
  providerDownVotes: number;
};

export type ActiveAuction = {
  auction: Auction;
  clientUpVotes: number;
  clientDownVotes: number;
};

export interface IAuctionsManager {
  setTasksManager(tasksManagerAddress: string): Promise<void>;
  createAuction({
    auctionDeadline,
    taskDeadline,
    clientVerification,
    code,
  }: TCreateAuction): Promise<CreatedAuction>;
  cancelAuction(auctionId: string): Promise<CancelledAuction>;
  bid(auctionId: string, bid: number): Promise<BidAuction>;
  finalize(auctionId: string, provider: string): Promise<void>;
  getActiveAuctions(): Promise<ActiveAuction[]>;
  getAuctionBids(auctionId: string): Promise<ProviderBid[]>;
  getAuctionsByClient(): Promise<Auction[]>;
  getAuctionWinnersByProvider(): Promise<Auction[]>;
  getAuctionActiveBidsByProvider(): Promise<Auction[]>;
  getOwner(): Promise<string>;
  getTasksManager(): Promise<string>;
}

export interface TransactionReceipt {
  to: string;
  from: string;
  contractAddress: string;
  blockHash: string;
  transactionHash: string;
  confirmations: number;
  gasUsed: number;
  cumulativeGasUsed: number;
  effectiveGasPrice: number;
  status: number;
}

export interface ContractReceipt<TEvent> extends TransactionReceipt {
  events?: Array<TEvent>;
}

export interface CreatedAuctionEvent {
  name: string;
  auctionID: string;
  client: string;
}

export interface CancelledAuctionEvent {
  name: string;
  auctionID: string;
  client: string;
}

export interface BidAuctionEvent {
  name: string;
  auctionID: string;
  provider: string;
  bid: number;
}
export interface CreatedAuction extends TransactionReceipt {
  event: CreatedAuctionEvent;
}

export interface CancelledAuction extends TransactionReceipt {
  event: CancelledAuctionEvent;
}

export interface BidAuction extends TransactionReceipt {
  event: BidAuctionEvent;
}
