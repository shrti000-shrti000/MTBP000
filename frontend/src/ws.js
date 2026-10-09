export default class WSClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.callbacks = [];
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("🟢 WS CONNECTED");
    };

    this.ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        this.callbacks.forEach(cb => cb(data));
      } catch (e) {}
    };

    this.ws.onerror = (e) => {
      console.log("❌ WS ERROR", e);
    };

    this.ws.onclose = () => {
      console.log("🔴 WS CLOSED");
    };
  }

  onMessage(cb) {
    this.callbacks.push(cb);
  }
}