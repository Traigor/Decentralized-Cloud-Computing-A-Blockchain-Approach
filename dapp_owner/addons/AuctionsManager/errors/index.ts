export interface IError {
  message: string;
}

export abstract class AuctionsManagerError extends Error implements IError {
  constructor(message: string) {
    super(message);
  }
}

export class NotCalledByOwnerError extends AuctionsManagerError {
  constructor() {
    super("Not called by owner");
  }
}

export class NotCalledByClientError extends AuctionsManagerError {
  constructor() {
    super("Not called by client");
  }
}

export class AuctionDoesNotExistError extends AuctionsManagerError {
  constructor() {
    super("Auction does not exist");
  }
}

export class TasksManagerNotSetError extends AuctionsManagerError {
  constructor() {
    super("TasksManager not set");
  }
}

export class AuctionNotInStateError extends AuctionsManagerError {
  constructor() {
    super("Auction not in correct state");
  }
}

export class ClientCannotBidError extends AuctionsManagerError {
  constructor() {
    super("Client cannot bid");
  }
}

export class AuctionDeadlineHasPassedError extends AuctionsManagerError {
  constructor() {
    super("Auction deadline has passed");
  }
}

export class BidNotLowerThanCurrentBidError extends AuctionsManagerError {
  constructor() {
    super("Bid not lower than current bid");
  }
}
