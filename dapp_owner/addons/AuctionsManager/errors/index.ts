export interface IError {
  message: string;
}

export abstract class AuctionsManagerError extends Error implements IError {
  public message: string;

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
