class WSClient {

    constructor() {

        this.ws = null;

        this.listeners = new Set();

    }

    connect() {

        if (this.ws) return;

        this.ws = new WebSocket("ws://localhost:8080");

        this.ws.onopen = () => {

            console.log("🟢 WS CONNECTED");

        };

        this.ws.onclose = () => {

            console.log("🔴 WS CLOSED");

            this.ws = null;

        };

        this.ws.onerror = (err) => {

            console.log("WS ERROR", err);

        };

        this.ws.onmessage = (event) => {

            try {

                const data = JSON.parse(event.data);

                
               console.log(
    JSON.stringify(data, null, 2)
);

                this.listeners.forEach(cb => cb(data));

            }

            catch (e) {

                console.log(e);

            }

        };

    }

    subscribe(callback) {

        this.listeners.add(callback);

    }

    unsubscribe(callback) {

        this.listeners.delete(callback);

    }

}

export default new WSClient();