export class BaseExchange {
  constructor(name) {
    this.name = name;
    this.onTickCallback = null;
  }

  onTick(cb) {
    this.onTickCallback = cb;
  }

  emitTick(data) {
    if (this.onTickCallback) {
      this.onTickCallback(data);
    }
  }
}