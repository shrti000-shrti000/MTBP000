// backend/exchanges/toobitExchange00.js

import { marketStore } from "../core/marketStore.js";

import fetch from "node-fetch";
import crypto from "crypto";

import ExchangeStateManager from "./ExchangeStateManager.js";


export class ToobitExchange {


    constructor() {

        this.ws = null;

        this.onTickCallback = null;

    }


    // ==================================================
    // SYMBOL CONVERTER
    // ==================================================

    convertSymbol(symbol) {

        if (!symbol) {

            return symbol;

        }


        if (symbol.endsWith("USDT")) {

            const coin =
                symbol.replace("USDT", "");


            return `${coin}-SWAP-USDT`;

        }


        return symbol;

    }


    // ==================================================
    // SIGNED REQUEST
    // ==================================================

    async signedRequest({

        method = "GET",

        endpoint,

        params = {},

    }) {


        const configModule =
            await import(
                "../config/exchanges.json",
                {
                    with: {
                        type: "json",
                    },
                }
            );


        const config =
            configModule.default.toobit;


        const timestamp =
            Date.now();


        const queryParams = {

            ...params,

            timestamp,

        };


        const query =
            new URLSearchParams(
                queryParams
            ).toString();


        const signature =
            crypto
                .createHmac(
                    "sha256",
                    config.secret
                )
                .update(query)
                .digest("hex");


        const url =
            `https://api.toobit.com${endpoint}?${query}&signature=${signature}`;


        const response =
            await fetch(
                url,
                {

                    method,

                    headers: {

                        "X-BB-APIKEY":
                            config.apiKey,

                    },

                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            );


        const text =
            await response.text();


        if (
            contentType &&
            contentType.includes(
                "application/json"
            )
        ) {

            return JSON.parse(text);

        }


        return {

            success: false,

            error:
                "Non JSON response",

            raw:
                text

        };

    }


    // ==================================================
    // BALANCE
    // ==================================================

    async getBalance() {

        return await this.signedRequest({

            method: "GET",

            endpoint:
                "/api/v1/futures/balance",

        });

    }


    // ==================================================
    // TICKER PRICE
    // ==================================================

    async getTickerPrice(symbol) {

        const response =
            await fetch(
                `https://api.toobit.com/api/v1/futures/ticker?symbol=${this.convertSymbol(symbol)}`
            );


        const data =
            await response.json();


        return Number(

            data.lastPrice ??

            data.price ??

            0

        );

    }


    // ==================================================
    // OPEN ORDERS
    // ==================================================

    async getOpenOrders(symbol = null) {

        const params = {};


        if (symbol) {

            params.symbol =
                symbol;

        }


        return await this.signedRequest({

            method: "GET",

            endpoint:
                "/api/v1/futures/openOrders",

            params

        });

    }


    // ==================================================
    // PLACE ORDER
    // ==================================================

    async placeOrder(order) {


        // ==============================================
        // VALIDATION
        // ==============================================

        if (!order) {

            console.log(
                "❌ TOOBIT ORDER ERROR: Order required"
            );


            return {

                success: false,

                error:
                    "Order required"

            };

        }


        // ==============================================
        // ORIGINAL SIDE
        // ==============================================

        let futuresSide =
            order.side;


        // ==============================================
        // OPEN LONG
        //
        // سیستم MTBP:
        // LONG
        //
        // Toobit:
        // BUY_OPEN
        // ==============================================

        if (
            order.side === "LONG"
        ) {

            futuresSide =
                "BUY_OPEN";

        }


        // ==============================================
        // OPEN SHORT
        //
        // سیستم MTBP:
        // SHORT
        //
        // Toobit:
        // SELL_OPEN
        // ==============================================

        if (
            order.side === "SHORT"
        ) {

            futuresSide =
                "SELL_OPEN";

        }


        // ==============================================
        // CLOSE LONG
        // ==============================================

        if (
            order.side === "SELL_CLOSE"
        ) {

            futuresSide =
                "SELL_CLOSE";

        }


        // ==============================================
        // CLOSE SHORT
        // ==============================================

        if (
            order.side === "BUY_CLOSE"
        ) {

            futuresSide =
                "BUY_CLOSE";

        }


        // ==============================================
        // SYMBOL
        // ==============================================

        const convertedSymbol =
            this.convertSymbol(
                order.symbol
            );


        // ==============================================
        // ORDER PARAMETERS
        // ==============================================

        const params = {

            symbol:
                convertedSymbol,


            side:
                futuresSide,


            type:
                "LIMIT",


            priceType:
                order.type === "LIMIT"
                    ? "INPUT"
                    : "MARKET",


            quantity:
                order.quantity,


            ...(order.type === "LIMIT" && {

                price:
                    order.price

            }),


            newClientOrderId:
                "mtbp_" + Date.now()

        };


        // ==============================================
        // DEBUG REQUEST
        // ==============================================

        console.log(
            "🚀 TOOBIT ORDER REQUEST:",
            {
                exchange:
                    "TOOBIT",

                originalSide:
                    order.side,

                futuresSide,

                symbol:
                    order.symbol,

                convertedSymbol,

                type:
                    order.type,

                quantity:
                    order.quantity,

                price:
                    order.price,

                params

            }
        );


        // ==============================================
        // SEND TO TOOBIT
        // ==============================================

        let response;


        try {

            response =
                await this.signedRequest({

                    method: "POST",

                    endpoint:
                        "/api/v1/futures/order",

                    params

                });

        }
        catch (error) {

            console.error(
                "❌ TOOBIT ORDER REQUEST ERROR:",
                error
            );


            throw error;

        }


        // ==============================================
        // DEBUG RESPONSE
        // ==============================================

        console.log(
            "📥 TOOBIT ORDER RESPONSE:",
            response
        );


        // ==============================================
        // RETURN RESPONSE
        // ==============================================

        return response;

    }


    // ==================================================
    // CANCEL ORDER
    // ==================================================

    async cancelOrder(order) {


        if (!order) {

            return {

                success: false,

                error:
                    "Order required"

            };

        }


        if (!order.orderId) {

            return {

                success: false,

                error:
                    "Order ID required"

            };

        }


        const response =
            await this.signedRequest({

                method: "DELETE",

                endpoint:
                    "/api/v1/futures/order",

                params: {

                    orderId:
                        order.orderId

                }

            });


        const failed =
            response?.code &&
            response.code !== 0;


        return {

            success:
                !failed,


            exchange:
                "TOOBIT",


            orderId:
                order.orderId,


            status:
                failed
                    ? "CANCEL_REJECTED"
                    : "CANCELED",


            raw:
                response

        };

    }


    // ==================================================
    // LISTEN KEY
    // ==================================================

    async getListenKey() {

        return await this.signedRequest({

            method: "POST",

            endpoint:
                "/api/v1/listenKey"

        });

    }


    // ==================================================
    // MARKET WEBSOCKET
    // ==================================================

    connect() {


        this.ws =
            new WebSocket(
                "wss://stream.toobit.com/quote/ws/v1"
            );


        this.ws.onopen = () => {


            // ==========================================
            // MARKET CONNECTION
            // ==========================================

            ExchangeStateManager.setConnected(
                "TOOBIT",
                true
            );


            console.log(
                "🟢 TOOBIT CONNECTED"
            );


            this.ws.send(

                JSON.stringify({

                    symbol: "all",

                    topic:
                        "wholeRealTime",

                    event: "sub"

                })

            );

        };


        // ==============================================
        // MARKET MESSAGE
        // ==============================================

        this.ws.onmessage = (msg) => {


            try {


                const json =
                    JSON.parse(
                        msg.data
                    );


                if (
                    json.topic !==
                    "wholeRealTime"
                ) {

                    return;

                }


                if (!json.data) {

                    return;

                }


                const list =
                    Array.isArray(
                        json.data
                    )
                        ?
                        json.data
                        :
                        [json.data];


                list.forEach(d => {


                    if (d?.s) {

                        marketStore.coins.add(
                            d.s
                        );

                    }


                    this.onTickCallback?.({

                        symbol:
                            d.s,


                        price:
                            Number(d.c),


                        volume:
                            Number(d.v),


                        time:
                            d.E ||
                            Date.now()

                    });


                });


            }
            catch (e) {

                console.error(
                    "PARSE ERROR",
                    e.message
                );

            }


        };


        // ==============================================
        // MARKET ERROR
        // ==============================================

        this.ws.onerror = (err) => {

            console.error(
                "❌ TOOBIT ERROR",
                err
            );

        };


        // ==============================================
        // MARKET CLOSED
        // ==============================================

        this.ws.onclose = () => {


            ExchangeStateManager.setConnected(
                "TOOBIT",
                false
            );


            console.log(
                "🔴 TOOBIT CLOSED"
            );


            setTimeout(

                () =>
                    this.connect(),

                3000

            );

        };

    }


    // ==================================================
    // SUBSCRIBE
    // ==================================================

    subscribe() {}


    // ==================================================
    // TICK CALLBACK
    // ==================================================

    onTick(cb) {

        this.onTickCallback =
            cb;

    }


}


// ======================================================
// END
// ======================================================