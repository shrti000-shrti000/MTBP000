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

import AccountStore from "../account/AccountStore.js";

import PositionStore from "../risk/PositionStore.js";

import PositionMonitor from "../risk/PositionMonitor.js";

import PositionSync from "../risk/PositionSync.js";

import IndicatorDispatcher from "../indicators/IndicatorDispatcher.js";


const symbols =
    MarketFilterEngine.initialize();
const DEBUG = false;

// ===============================
// Indicator Engine
// ===============================

import { initialize } from "../indicators/index.js";

export class ExchangeManager {

    constructor() {

    this.candleStore = new CandleStore(500);

    //this.candleBuilder = new CandleBuilder(
     //   this.candleStore,
      //  [60000, 300000]
    //);



    this.candleBuilder = new CandleBuilder(
    this.candleStore
);




    this.volumeTracker = new VolumeTracker();


    this.adapters = {};

}

    async init() {

        console.log("🚀 BOOTING SYSTEM");

        // ===============================
        // Register Indicators
        // ===============================

        initialize();

        console.log("📈 INDICATORS REGISTERED");


        // ===============================
// REBUILD INDICATORS FROM HISTORY
// ===============================

console.log(
    "🔄 REBUILDING INDICATORS FROM CANDLE HISTORY"
);

const candleHistory =
    this.candleStore.snapshot();

for (const symbol of Object.keys(candleHistory)) {

    for (const timeframe of this.candleStore.getTimeframes()) {

        const candles =
            candleHistory[symbol]?.[timeframe];

        if (
            !Array.isArray(candles) ||
            candles.length === 0
        ) {
            continue;
        }

        console.log(
            "🔄 INDICATOR REPLAY:",
            symbol,
            timeframe,
            "CANDLES:",
            candles.length
        );

        for (const candle of candles) {

            IndicatorDispatcher.dispatch(
                "TOOBIT",
                symbol,
                timeframe,
                candle
            );

        }

    }

}

console.log(
    "✅ INDICATOR HISTORY REBUILT"
);

        const symbols = MarketFilterEngine.initialize();

        console.log("📊 SYMBOLS:", symbols.length);

        // =====================================
        // موقتاً غیرفعال تا RateLimit را بعداً درست کنیم
        // =====================================

        /*
        const history = new CandleHistory("https://api.toobit.com");

        const candleHistory = await history.getBatch(
            symbols,
            "1m",
            200
        );

        for (const s of symbols) {

            this.candleStore.addHistory(
                s,
                candleHistory[s] || []
            );

        }

        console.log("📊 HISTORICAL CANDLES LOADED");
        */

        const toobit = new ToobitExchange();

        this.adapters.TOOBIT = toobit;

        // ===============================
// TOOBIT USER STREAM
// ===============================

const listenKey =
    await toobit.getListenKey();


ToobitUserStream.onMessage(

    (event) => {


        console.log(
        "🔥RAW TOOBIT USER EVENT:",
        JSON.stringify(event, null, 2)
        );


        OrderEventHandler.handle(

            event

        );


        PositionSync.handle(

            event

        );


    }

);

ToobitUserStream.connect(

    listenKey.listenKey

);

        const account =
    await toobit.getBalance();

AccountStore.update(
    account
);

console.log(
    "ACCOUNT BALANCE:",
    AccountStore.getBalance()
);

        toobit.onTick((tick) => {

            console.log("TICK", tick);

            if (!tick?.symbol) return;

if (!ActiveSymbolsStore.has(tick.symbol)) {

    return;

}



            // ===============================
            // MARKET STORE
            // ===============================

            marketStore.prices[tick.symbol] = {

                symbol: tick.symbol,

                price: tick.price,

                volume: tick.volume,

                change: tick.change ?? 0,

                time: tick.time

            };


if (DEBUG) {

    console.log(

        "STORE SIZE:",

        Object.keys(
            marketStore.prices
        ).length

    );

}



            marketStore.system.lastUpdate = tick.time;

// ===============================
// POSITION UPDATE
// ===============================


console.log(
    "🧪 POSITION PRICE CHECK:",
    {
        symbol: tick.symbol,
        price: tick.price,
        positions: PositionStore.getAll().map(p => ({
            symbol: p.symbol,
            side: p.side,
            entry: p.entryPrice,
            current: p.currentPrice,
            sl: p.stopLoss,
            tp: p.takeProfit,
            status: p.status
        }))
    }
);


PositionStore.updatePrice(

    tick.symbol,

    tick.price

);

// ===============================
// POSITION MONITOR
// ===============================

PositionMonitor.update();

// ===============================
// CANDLE BUILDER
// ===============================

this.candleBuilder.onTick(tick);


            //const candle =
             //   this.candleBuilder.getCurrent(tick.symbol);

           // if (candle) {

            //    this.candleStore.push(
            //        tick.symbol,
            //        candle
            //    );

           // }



         //  const candle =
    //this.candleBuilder.getCurrent(
     //   tick.symbol
   // );

//if (candle) {

    //this.candleStore.push(
        //tick.symbol,
    //    candle.interval,
      //  candle
  //  );

//}

            // ===============================
            // VOLUME TRACKER
            // ===============================

            this.volumeTracker.update(tick);

        });

        toobit.connect();

        console.log("🟢 SYSTEM READY");

    }

    getAdapter(exchange) {

        return this.adapters[exchange];

    }



    async getCurrentPrice(exchange, symbol) {

    const adapter =
        this.getAdapter(
            exchange.toUpperCase()
        );


    if (!adapter) {

        return null;

    }


    if (!adapter.getTickerPrice) {

        return null;

    }


    return await adapter.getTickerPrice(symbol);

}

}

export const exchangeManager =
    new ExchangeManager();