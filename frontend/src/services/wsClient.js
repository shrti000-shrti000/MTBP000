
class WSClient {

    constructor() {

        this.ws = null;

        this.listeners = new Set();

        this.url = "ws://localhost:8080";

    }


    // =========================================
    // CONNECT
    // =========================================

    connect() {

        if (
            this.ws &&
            (
                this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }


        this.ws = new WebSocket(this.url);


        // =====================================
        // OPEN
        // =====================================

        this.ws.onopen = () => {

            // اتصال برقرار شد

        };


        // =====================================
        // CLOSE
        // =====================================

        this.ws.onclose = () => {

            this.ws = null;

        };


        // =====================================
        // ERROR
        // =====================================

        this.ws.onerror = () => {

            // خطا توسط onclose مدیریت می‌شود

        };


        // =====================================
        // MESSAGE
        // =====================================

        this.ws.onmessage = (event) => {

            try {

                const data =
                    JSON.parse(event.data);


                this.listeners.forEach(
                    (callback) => {

                        try {

                            callback(data);

                        } catch {

                            // خطای یک Widget نباید
                            // سایر Widgetها را متوقف کند

                        }

                    }
                );

            }

            catch {

                // پیام نامعتبر نادیده گرفته می‌شود

            }

        };

    }


    // =========================================
    // SUBSCRIBE
    // =========================================

    subscribe(callback) {

        if (
            typeof callback !== "function"
        ) {
            return;
        }

        this.listeners.add(callback);

    }


    // =========================================
    // UNSUBSCRIBE
    // =========================================

    unsubscribe(callback) {

        this.listeners.delete(callback);

    }


    // =========================================
    // STATUS
    // =========================================

    isConnected() {

        return (
            !!this.ws &&
            this.ws.readyState === WebSocket.OPEN
        );

    }

}


export default new WSClient();

