

//



import { ToobitExchange } from "./toobitExchange00.js";

import { CandleHistory } from "../candles/candleHistory.js";
import { CandleStore } from "../candles/candleStore.js";
import { CandleBuilder } from "../candles/candleBuilder.js";
import { VolumeTracker } from "../candles/volumeTracker.js";

import { marketStore } from "../core/marketStore.js";

import ToobitUserStream from "./toobit/ToobitUserStream.js";

import OrderEventHandler from "../execution/OrderEventHandler.js";

import { MarketFilterEngine } from "../filter/MarketFilterEngine.js";

import ActiveSymbolsStore from "../filter/ActiveSymbolsStore.js";

import AccountService from "./toobit/AccountService.js";

import PositionStore from "../risk/PositionStore.js";

import PositionMonitor from "../risk/PositionMonitor.js";

import PositionSync from "../risk/PositionSync.js";

import IndicatorDispatcher from "../indicators/IndicatorDispatcher.js";

import { initialize } from "../indicators/index.js";

import ExchangeStateManager from "./ExchangeStateManager.js";

import StrategyManager from "../strategy/StrategyManager.js";

import IndicatorStore from "../indicators/core/IndicatorStore.js";

import PaperTradingManager from "../config/PaperTradingManager.js";

import LiveTradingManager from "../config/LiveTradingManager.js";

import LiveAccountStore from "../storage/LiveAccountStore.js";

const symbols =
MarketFilterEngine.initialize();

const DEBUG = false;

// ============================================================
// EXCHANGE IDENTIFIER
// ============================================================

const TOOBIT_EXCHANGE =
"TOOBIT";

// ============================================================
// PRODUCTION HISTORY SETTINGS
// ============================================================

const HISTORY_TIMEFRAMES = [
"1m",
"5m",
"15m",
"30m",
"1h",
"4h",
];

const HISTORY_LIMIT = 200;

const HISTORY_CONCURRENCY = 12;

// ============================================================
// EXCHANGE MANAGER
// ============================================================

export class ExchangeManager {


constructor() {

    this.candleStore =
        new CandleStore(500);


    this.candleBuilder =
        new CandleBuilder(

            this.candleStore,

            async (
                symbol,
                timeframe,
                candle
            ) => {

                // ==========================================
                // GET INDICATORS
                // ==========================================

                const indicators =
                    IndicatorStore.getAll(
                        TOOBIT_EXCHANGE,
                        symbol,
                        timeframe
                    );


                // ==========================================
                // MARKET DATA
                // ==========================================

                const price =
                    Number(candle?.close);


                if (!Number.isFinite(price)) {
                    return;
                }


                const liveAccount =
                    LiveAccountStore.getByExchange(
                        TOOBIT_EXCHANGE
                    );


                const balance =
                    LiveTradingManager.isPaperMode()
                        ? PaperTradingManager.getBalance()
                        : Number(
                            liveAccount?.balance ?? 0
                        );


                const marketData = {

                    price,

                    balance

                };


                // ==========================================
                // STRATEGY
                // ==========================================

                await StrategyManager.process(

                    TOOBIT_EXCHANGE,

                    symbol,

                    timeframe,

                    indicators,

                    marketData

                );

            }

        );


    this.volumeTracker =
        new VolumeTracker();


    // ====================================================
    // ADAPTER REGISTRY
    // ====================================================

    this.adapters = {};


    // ====================================================
    // INITIALIZED EXCHANGES
    // ====================================================

    this.initializedExchanges =
        new Set();

}


// ========================================================
// REGISTER EXCHANGE
// ========================================================

registerExchange(exchange) {

    return ExchangeStateManager.register(
        exchange
    );

}


// ========================================================
// MERGE HISTORICAL CANDLES
// ========================================================

mergeCandles(
    existing = [],
    historical = []
) {

    const map = new Map();


    for (const candle of existing) {

        if (
            candle &&
            candle.openTime != null
        ) {

            map.set(
                Number(candle.openTime),
                candle
            );

        }

    }


    for (const candle of historical) {

        if (
            candle &&
            candle.openTime != null
        ) {

            map.set(
                Number(candle.openTime),
                candle
            );

        }

    }


    return Array.from(
        map.values()
    )
        .sort(
            (a, b) =>
                Number(a.openTime) -
                Number(b.openTime)
        )
        .slice(-500);

}


// ========================================================
// LOAD / RECONCILE HISTORICAL CANDLES
// ========================================================

async loadHistoricalCandles(
    activeSymbols
) {

    const history =
        new CandleHistory(
            "https://api.toobit.com"
        );


    const jobs = [];


    for (const symbol of activeSymbols) {

        for (
            const timeframe
            of HISTORY_TIMEFRAMES
        ) {

            jobs.push({
                symbol,
                timeframe,
            });

        }

    }


    let completed = 0;


    // ====================================================
    // WORKER
    // ====================================================

    const worker = async () => {

        while (true) {

            const index =
                this.historyJobIndex++;


            if (
                index >= jobs.length
            ) {

                return;

            }


            const job =
                jobs[index];


            try {

                const historical =
                    await history.getOHLCV(
                        job.symbol,
                        job.timeframe,
                        HISTORY_LIMIT
                    );


                const now =
                    Date.now();


                // ========================================
                // فقط کندل‌های واقعاً بسته‌شده
                // ========================================

                const closedHistorical =
                    historical.filter(
                        (candle) => {

                            if (
                                !candle ||
                                candle.openTime == null
                            ) {

                                return false;

                            }


                            const closeTime =
                                Number(
                                    candle.closeTime
                                );


                            if (
                                Number.isFinite(
                                    closeTime
                                ) &&
                                closeTime > 0
                            ) {

                                return (
                                    closeTime <= now
                                );

                            }


                            return (
                                Number(
                                    candle.openTime
                                ) < now
                            );

                        }
                    );


                const existing =
                    this.candleStore.get(
                        job.symbol,
                        job.timeframe
                    );


                const merged =
                    this.mergeCandles(
                        existing,
                        closedHistorical
                    );


                this.candleStore.addHistory(
                    job.symbol,
                    job.timeframe,
                    merged
                );


                completed++;


            } catch (error) {

                console.error(
                    "❌ HISTORY LOAD ERROR:",
                    job.symbol,
                    job.timeframe,
                    error.message
                );

            }

        }

    };


    // ====================================================
    // CONTROLLED CONCURRENCY
    // ====================================================

    this.historyJobIndex = 0;


    const workerCount =
        Math.min(
            HISTORY_CONCURRENCY,
            jobs.length
        );


    const workers = [];


    for (
        let i = 0;
        i < workerCount;
        i++
    ) {

        workers.push(
            worker()
        );

    }


    await Promise.all(
        workers
    );

}


// ========================================================
// REBUILD INDICATORS
// ========================================================

async rebuildIndicators() {

    const candleHistory =
        this.candleStore.snapshot();

    const timeframes =
        this.candleStore.getTimeframes();

    const symbols =
        Object.keys(candleHistory);


    const BATCH_SIZE = 50;


    for (
        const symbol
        of symbols
    ) {

        for (
            const timeframe
            of timeframes
        ) {

            const candles =
                candleHistory[
                    symbol
                ]?.[
                    timeframe
                ];


            if (
                !Array.isArray(candles) ||
                candles.length === 0
            ) {

                continue;

            }


            for (
                let i = 0;
                i < candles.length;
                i++
            ) {

                const candle =
                    candles[i];


                if (!candle) {

                    continue;

                }


                IndicatorDispatcher.dispatch(
                    TOOBIT_EXCHANGE,
                    symbol,
                    timeframe,
                    candle
                );


                if (
                    (i + 1) %
                    BATCH_SIZE ===
                    0
                ) {

                    await new Promise(
                        resolve =>
                            setImmediate(resolve)
                    );

                }

            }

        }

    }

}


// ========================================================
// INIT
// ========================================================

async init() {

    // ====================================================
    // REGISTER INDICATORS
    // ====================================================

    initialize();


    // ====================================================
    // REGISTER TOOBIT
    // ====================================================

    this.registerExchange(
        TOOBIT_EXCHANGE
    );


    // ====================================================
    // ACTIVE SYMBOLS
    // ====================================================

    const activeSymbols =
        MarketFilterEngine.initialize();


    const historySymbols =
        activeSymbols;


    // ====================================================
    // REAL HISTORY BOOTSTRAP
    // ====================================================

    await this.loadHistoricalCandles(
        historySymbols
    );


    // ====================================================
    // REBUILD INDICATORS
    // ====================================================

    await this.rebuildIndicators();


    // ====================================================
    // TOOBIT ADAPTER
    // ====================================================

    const toobit =
        new ToobitExchange();


    this.adapters[
        TOOBIT_EXCHANGE
    ] =
        toobit;


    // ====================================================
    // TOOBIT API + USER STREAM
    //
    // REST API و User Stream کاملاً مستقل هستند.
    //
    // apiConnected  = وضعیت REST API
    // userStream    = وضعیت User Stream
    // ====================================================

    try {

        // =================================================
        // REST API
        // =================================================

        const listenKey =
            await toobit.getListenKey();


        ExchangeStateManager.setApiConnected(
            TOOBIT_EXCHANGE,
            true
        );


        // =================================================
        // USER STREAM
        // =================================================

        try {

            ToobitUserStream.onMessage(

                (event) => {

                    OrderEventHandler.handle(
                        event
                    );


                    PositionSync.handle(
                        event
                    );

                }

            );


            ToobitUserStream.connect(

                listenKey.listenKey,

                (connected) => {

                    ExchangeStateManager.setUserStreamConnected(
                        TOOBIT_EXCHANGE,
                        connected
                    );

                }

            );


        } catch (error) {

            console.error(
                "❌ TOOBIT USER STREAM ERROR:",
                error.message
            );


            ExchangeStateManager.setUserStreamConnected(
                TOOBIT_EXCHANGE,
                false
            );

        }


    } catch (error) {

        console.error(
            "❌ TOOBIT API CONNECTION ERROR:",
            error.message
        );


        ExchangeStateManager.setApiConnected(
            TOOBIT_EXCHANGE,
            false
        );


        ExchangeStateManager.setUserStreamConnected(
            TOOBIT_EXCHANGE,
            false
        );

    }


    // ====================================================
    // ACCOUNT
    // ====================================================

    try {

        const balances =
            await toobit.getBalance();


        // ================================================
        // TOOBIT FUTURES BALANCE
        // فقط موجودی USDT
        // ================================================

        const usdtAccount =
            Array.isArray(balances)
                ? balances.find(
                    item =>
                        String(item?.coin)
                            .toUpperCase() === "USDT"
                )
                : null;


        // ================================================
        // EMPTY BALANCE
        // ================================================

        if (
            Array.isArray(balances) &&
            balances.length === 0
        ) {

            await AccountService.update(0);

            console.log(
                "🟡 TOOBIT LIVE BALANCE: 0"
            );

        }


        // ================================================
        // USDT BALANCE FOUND
        // ================================================

        else if (usdtAccount) {

            const balance =
                Number(
                    usdtAccount.balance
                );


            if (
                !Number.isFinite(balance)
            ) {

                console.error(
                    "❌ INVALID TOOBIT BALANCE:",
                    usdtAccount.balance
                );

            } else {

                await AccountService.update(
                    balance
                );


                console.log(
                    "🟢 TOOBIT LIVE BALANCE:",
                    balance
                );

            }

        }


        // ================================================
        // OTHER RESPONSE
        // ================================================

        else {

            console.error(
                "❌ TOOBIT USDT BALANCE NOT FOUND:",
                JSON.stringify(balances)
            );

        }

    } catch (error) {

        console.error(
            "❌ TOOBIT ACCOUNT ERROR:",
            error.message
        );

    }


    // ====================================================
    // LIVE MARKET DATA
    // ====================================================

    toobit.onTick(

        (tick) => {

            if (!tick?.symbol) {

                return;

            }


            // Active-symbol filtering is for market scanning and new entries.
            // Open positions must keep receiving ticks even after a symbol leaves
            // the active filter, otherwise exit monitoring can use a stale price.
            const isActiveSymbol =
                ActiveSymbolsStore.has(
                    tick.symbol
                );

            const hasOpenPosition =
                PositionStore.hasOpenPosition(
                    tick.symbol
                );

            if (
                !isActiveSymbol &&
                !hasOpenPosition
            ) {

                return;

            }


            // ==========================================
            // MARKET STORE
            // ==========================================

            marketStore.prices[
                tick.symbol
            ] = {

                symbol:
                    tick.symbol,

                price:
                    tick.price,

                volume:
                    tick.volume,

                change:
                    tick.change ?? 0,

                time:
                    tick.time

            };


            if (DEBUG) {

                // Debug intentionally disabled.

            }


            marketStore.system.lastUpdate =
                tick.time;


            // ==========================================
            // POSITION PRICE
            // ==========================================

            PositionStore.updatePrice(
                tick.symbol,
                tick.price
            );


            // ==========================================
            // POSITION MONITOR
            // ==========================================

            PositionMonitor.update();

            // Do not feed inactive symbols to CandleBuilder: that path can
            // generate new strategy signals. Existing positions have already
            // received the tick and had their exit conditions checked above.
            if (!isActiveSymbol) {
                return;
            }


            // ==========================================
            // CANDLE BUILDER
            // ==========================================

            this.candleBuilder.onTick(
                tick
            );


            // ==========================================
            // VOLUME TRACKER
            // ==========================================

            this.volumeTracker.update(
                tick
            );

        }

    );


    // ====================================================
    // LIVE CONNECTION
    // ====================================================

    try {

        toobit.connect();


        // =================================================
        // MARKET CONNECTION
        // =================================================

        ExchangeStateManager.setConnected(
            TOOBIT_EXCHANGE,
            true
        );


    } catch (error) {

        console.error(
            "❌ TOOBIT CONNECTION ERROR:",
            error.message
        );


        ExchangeStateManager.setConnected(
            TOOBIT_EXCHANGE,
            false
        );

    }


    // ====================================================
    // MARK INITIALIZATION
    // ====================================================

    this.initializedExchanges.add(
        TOOBIT_EXCHANGE
    );

}


// ========================================================
// GET ADAPTER
// ========================================================

getAdapter(exchange) {

    const key =
        String(exchange)
            .trim()
            .toUpperCase();


    return this.adapters[
        key
    ];

}


// ========================================================
// GET EXCHANGE STATE
// ========================================================

getExchangeState(exchange) {

    return ExchangeStateManager.getState(
        exchange
    );

}


// ========================================================
// GET ALL EXCHANGE STATES
// ========================================================

getAllExchangeStates() {

    return ExchangeStateManager.getAll();

}


// ========================================================
// CAN TRADE
// ========================================================

canTrade(exchange) {

    return ExchangeStateManager.canTrade(
        exchange
    );

}


// ========================================================
// CURRENT PRICE
// ========================================================

async getCurrentPrice(
    exchange,
    symbol
) {

    const adapter =
        this.getAdapter(
            exchange
        );


    if (!adapter) {

        return null;

    }


    if (
        !adapter.getTickerPrice
    ) {

        return null;

    }


    return await adapter.getTickerPrice(
        symbol
    );

}


}

// ========================================================
// SINGLETON
// ========================================================

export const exchangeManager =
new ExchangeManager();
