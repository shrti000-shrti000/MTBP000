import { EventEmitter } from "events";

class EventBus {
  constructor() {
    this.bus = new EventEmitter();
  }

  emit(event, data) {
    this.bus.emit(event, data);
  }

  on(event, callback) {
    this.bus.on(event, callback);
  }

  off(event, callback) {
    this.bus.off(event, callback);
  }
}

export const eventBus = new EventBus();