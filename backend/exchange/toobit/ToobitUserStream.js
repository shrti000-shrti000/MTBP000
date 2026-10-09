import WebSocket from "ws";


class ToobitUserStream {


    constructor() {

        this.ws = null;

        this.listenKey = null;

        this.onMessageCallback = null;

        // ==================================================
        // USER STREAM STATUS
        // ==================================================

        this.connected = false;

        this.onStatusCallback = null;

    }



    // ======================================================
    // CONNECT
    // ======================================================

    connect(
        listenKey,
        onStatus = null
    ) {


        this.listenKey =
            listenKey;


        // ==================================================
        // STATUS CALLBACK
        // ==================================================

        this.onStatusCallback =
            onStatus;


        // ==================================================
        // CREATE WEBSOCKET
        // ==================================================

        this.ws =
            new WebSocket(

                `wss://stream.toobit.com/api/v1/ws/${listenKey}`

            );



        // ==================================================
        // OPEN
        // ==================================================

        this.ws.onopen = () => {


            this.connected =
                true;


            // اطلاع به ExchangeManager

            this.onStatusCallback?.(
                true
            );


            // console.log(
            //     "🟢 TOOBIT USER STREAM CONNECTED"
            // );

        };



        // ==================================================
        // MESSAGE
        // ==================================================

        this.ws.onmessage = (msg) => {


            try {


                const data =
                    JSON.parse(
                        msg.data
                    );


                this.onMessageCallback?.(
                    data
                );


            }

            catch(error) {


                console.error(
                    "USER STREAM PARSE ERROR",
                    error.message
                );


            }

        };



        // ==================================================
        // ERROR
        // ==================================================

        this.ws.onerror = (error) => {


            this.connected =
                false;


            // اطلاع به ExchangeManager

            this.onStatusCallback?.(
                false
            );


            // console.log(
            //     "❌ USER STREAM ERROR",
            //     error
            // );

        };



        // ==================================================
        // CLOSE
        // ==================================================

        this.ws.onclose = () => {


            this.connected =
                false;


            // اطلاع به ExchangeManager

            this.onStatusCallback?.(
                false
            );


            // console.log(
            //     "🔴 USER STREAM CLOSED"
            // );

        };


    }



    // ======================================================
    // MESSAGE CALLBACK
    // ======================================================

    onMessage(
        callback
    ) {


        this.onMessageCallback =
            callback;


    }



    // ======================================================
    // STATUS CALLBACK
    // ======================================================

    onStatus(
        callback
    ) {


        this.onStatusCallback =
            callback;


    }



    // ======================================================
    // GET STATUS
    // ======================================================

    isConnected() {

        return this.connected;

    }


}


export default new ToobitUserStream();