import { WebSocketServer } from "ws";

import IndicatorStore from "./indicators/core/IndicatorStore.js";

import SignalEngine from "./strategy/SignalEngine.js";

import AccountStore from "./account/AccountStore.js";

import PositionStore from "./risk/PositionStore.js";


// ======================================================
// WEBSOCKET SERVER
// ======================================================

export function createWSServer(
    marketStore,
    candleStore,
    volumeTracker
) {


    const wss =
        new WebSocketServer({
            port: 8080
        });


    // ==================================================
    // CONNECTION
    // ==================================================

    wss.on("connection", (ws) => {


        // ==================================================
        // SEND
        // ==================================================

        const send = async () => {


            // ==================================================
            // PRIORITY SYMBOLS
            // ==================================================

            const priority = [

                "BTCUSDT",
                "ETHUSDT",
                "SOLUSDT",
                "XRPUSDT",
                "DOGEUSDT",
                "ADAUSDT",
                "TRXUSDT",
                "AVAXUSDT",
                "LINKUSDT",

            ];


            // ==================================================
            // MARKET DATA
            // ==================================================

            const market =
                Object.values(
                    marketStore.prices || {}
                )
                .filter(
                    (c) =>
                        c &&
                        c.price > 0
                )
                .sort(
                    (a, b) => {

                        const pa =
                            priority.indexOf(
                                a.symbol
                            );


                        const pb =
                            priority.indexOf(
                                b.symbol
                            );


                        if (
                            pa !== -1 &&
                            pb !== -1
                        ) {

                            return pa - pb;

                        }


                        if (
                            pa !== -1
                        ) {

                            return -1;

                        }


                        if (
                            pb !== -1
                        ) {

                            return 1;

                        }


                        return (
                            (b.volume || 0)
                            -
                            (a.volume || 0)
                        );

                    }
                );


            // ==================================================
            // CANDLES
            // ==================================================

            const candlesSnapshot =
                typeof candleStore?.snapshot === "function"

                    ? candleStore.snapshot()

                    : {};


            // ==================================================
            // VOLUME
            // ==================================================

            const volumeSnapshot =
                typeof volumeTracker?.snapshot === "function"

                    ? volumeTracker.snapshot()

                    : {};


            // ==================================================
            // INDICATOR SNAPSHOT
            // ==================================================

            const indicatorSnapshot = {};


            if (
                IndicatorStore.store
            ) {

                for (
                    const [key, value]
                    of IndicatorStore.store.entries()
                ) {

                    const parts =
                        key.split(":");


                    const exchange =
                        parts[0];

                    const symbol =
                        parts[1];

                    const timeframe =
                        parts[2];


                    if (
                        !exchange ||
                        !symbol ||
                        !timeframe
                    ) {

                        continue;

                    }


                    if (
                        !indicatorSnapshot[exchange]
                    ) {

                        indicatorSnapshot[
                            exchange
                        ] = {};

                    }


                    if (
                        !indicatorSnapshot[
                            exchange
                        ][symbol]
                    ) {

                        indicatorSnapshot[
                            exchange
                        ][symbol] = {};

                    }


                    indicatorSnapshot[
                        exchange
                    ][symbol][timeframe] =
                        value;

                }

            }


            // ==================================================
            // MARKET STREAM
            // ==================================================

            ws.send(

                JSON.stringify({

                    type:
                        "market",

                    data:
                        market

                })

            );


            // ==================================================
            // DASHBOARD SIGNAL SNAPSHOT
            // ==================================================

            const signalSnapshot = {};


            for (
                const exchange
                in indicatorSnapshot
            ) {


                if (
                    !signalSnapshot[
                        exchange
                    ]
                ) {

                    signalSnapshot[
                        exchange
                    ] = {};

                }


                for (
                    const symbol
                    in indicatorSnapshot[
                        exchange
                    ]
                ) {


                    if (
                        !signalSnapshot[
                            exchange
                        ][symbol]
                    ) {

                        signalSnapshot[
                            exchange
                        ][symbol] = {};

                    }


                    for (
                        const timeframe
                        in indicatorSnapshot[
                            exchange
                        ][symbol]
                    ) {


                        // ==========================================
                        // INDICATORS
                        // ==========================================

                        const indicators =
                            indicatorSnapshot[
                                exchange
                            ][symbol][timeframe];


                        // ==========================================
                        // SIGNAL ENGINE
                        //
                        // فقط برای Dashboard
                        //
                        // StrategyManager.process()
                        // اینجا اجرا نمی‌شود.
                        //
                        // بنابراین:
                        //
                        // ❌ Trade Gate
                        // ❌ Risk Manager
                        // ❌ Execution Engine
                        //
                        // از این مسیر اجرا نمی‌شوند.
                        // ==========================================

                        const signal =
                            SignalEngine.calculate(
                                indicators
                            );


                        // ==========================================
                        // SIGNAL SNAPSHOT
                        // ==========================================

                        signalSnapshot[
                            exchange
                        ][symbol][timeframe] = {

                            // --------------------------------------
                            // MAIN SIGNAL
                            // --------------------------------------

                            signal:
                                signal.signal,

                            action:
                                signal.action,


                            // --------------------------------------
                            // SCORES
                            // --------------------------------------

                            buyScore:
                                signal.buyScore,

                            sellScore:
                                signal.sellScore,


                            // --------------------------------------
                            // VOTES
                            // --------------------------------------

                            buyVotes:
                                signal.buyVotes,

                            sellVotes:
                                signal.sellVotes,


                            // --------------------------------------
                            // TOTAL WEIGHT
                            // --------------------------------------

                            totalWeight:
                                signal.totalWeight,


                            // --------------------------------------
                            // CONFIDENCE
                            // --------------------------------------

                            confidence:
                                signal.confidence,


                            // --------------------------------------
                            // DETAILS
                            // --------------------------------------

                            details: {

                                rsi: {

                                    score:
                                        signal.details?.rsi?.score
                                        ?? 0

                                },


                                ema: {

                                    score:
                                        signal.details?.ema?.score
                                        ?? 0

                                },


                                macd: {

                                    score:
                                        signal.details?.macd?.score
                                        ?? 0

                                },


                                volume: {

                                    score:
                                        signal.details?.volume?.score
                                        ?? 0

                                }

                            }

                        };

                    }

                }

            }


            // ==================================================
            // DASHBOARD
            // ==================================================

            ws.send(

                JSON.stringify({

                    type:
                        "dashboard",


                    market:
                        marketStore.prices || {},


                    candles:
                        candlesSnapshot,


                    volume:
                        volumeSnapshot,


                    indicators:
                        indicatorSnapshot,


                    signal:
                        signalSnapshot,


                    serverTime:
                        Date.now()

                })

            );

        };


        // ==================================================
        // FIRST SEND
        // ==================================================

        send();


        // ==================================================
        // UPDATE EVERY 3 SECONDS
        // ==================================================

        const interval =
            setInterval(
                send,
                3000
            );


        // ==================================================
        // CONNECTION CLOSE
        // ==================================================

        ws.on(
            "close",
            () => {

                clearInterval(
                    interval
                );

            }
        );

    });

}