import IndicatorDispatcher from "../indicators/IndicatorDispatcher.js";

const DEBUG = false;

export class CandleBuilder {

    //constructor(store) {

      //  this.store = store;



      constructor(store, onClosedCandle = null) {

    this.store = store;

    this.onClosedCandle =
        typeof onClosedCandle === "function"
            ? onClosedCandle
            : null;





        // ============================
        // REAL PRODUCTION TIMEFRAMES
        // ============================

        this.timeframes = {

            "1m": 60 * 1000,

            "5m": 5 * 60 * 1000,

            "15m": 15 * 60 * 1000,

            "30m": 30 * 60 * 1000,

            "1h": 60 * 60 * 1000,

            "4h": 4 * 60 * 60 * 1000,

        };


        // ============================
        // CURRENT OPEN CANDLES
        // ============================

        this.current =
            Object.create(null);

    }


    // ======================================
    // INIT SYMBOL
    // ======================================

    initSymbol(symbol) {

        if (!this.current[symbol]) {

            this.current[symbol] =
                Object.create(null);

        }

    }


    // ======================================
    // PROCESS TICK
    // ======================================

    onTick(tick) {

        if (!tick) return;


        const {

            symbol,

            price,

            volume = 0,

            time,

        } = tick;


        if (!symbol) return;

        if (price == null) return;


        this.initSymbol(symbol);


        const now =
            time || Date.now();


        // ======================================
        // BUILD EVERY REAL TIMEFRAME
        // ======================================

        for (
            const tf of Object.keys(this.timeframes)
        ) {

            const interval =
                this.timeframes[tf];


            const bucket =
                Math.floor(now / interval) *
                interval;


            let candle =
                this.current[symbol][tf];


            // ==================================
            // NEW CANDLE
            // ==================================

            if (
                !candle ||
                candle.openTime !== bucket
            ) {


                // ==============================
                // CLOSE PREVIOUS CANDLE
                // ==============================

                if (candle) {

                    const closedCandle = {
                        ...candle
                    };


                    // ==========================
                    // SAVE CLOSED CANDLE
                    // ==========================

                    this.store.push(
                        symbol,
                        tf,
                        closedCandle
                    );


                    // ==========================
                    // INDICATOR PIPELINE
                    // ==========================

                    if (DEBUG) {

                        console.log(

                            "SENDING CLOSED CANDLE TO INDICATOR",

                            symbol,

                            tf,

                            closedCandle

                        );

                    }


                    IndicatorDispatcher.dispatch(

                        "TOOBIT",

                        symbol,

                        tf,

                        closedCandle

                    );




                    // ======================================
// STRATEGY PIPELINE
// ======================================

if (this.onClosedCandle) {

    Promise.resolve(
        this.onClosedCandle(
            symbol,
            tf,
            closedCandle
        )
    )
    .catch(error => {

        console.error(
            "❌ STRATEGY PIPELINE ERROR:",
            symbol,
            tf,
            error?.message || error
        );

    });

}



                }


                // ==============================
                // START NEW CANDLE
                // ==============================

                this.current[symbol][tf] = {

                    symbol,

                    interval: tf,

                    openTime: bucket,

                    open: Number(price),

                    high: Number(price),

                    low: Number(price),

                    close: Number(price),

                    volume: Number(volume),

                };


                continue;

            }


            // ==================================
            // UPDATE CURRENT OPEN CANDLE
            // ==================================

            candle.close =
                Number(price);


            if (
                price > candle.high
            ) {

                candle.high =
                    Number(price);

            }


            if (
                price < candle.low
            ) {

                candle.low =
                    Number(price);

            }


            candle.volume +=
                Number(volume);

        }

    }


    // ======================================
    // GET CURRENT CANDLE
    // ======================================

    getCurrent(
        symbol,
        timeframe = "1m"
    ) {

        return (

            this.current?.[symbol]?.[timeframe]

            ||

            null

        );

    }


    // ======================================
    // GET ALL CURRENT CANDLES
    // ======================================

    getAllCurrent(symbol) {

        return (

            this.current?.[symbol]

            ||

            Object.create(null)

        );

    }


    // ======================================
    // GET TIMEFRAMES
    // ======================================

    getTimeframes() {

        return Object.keys(
            this.timeframes
        );

    }


    // ======================================
    // CLEAR SYMBOL
    // ======================================

    clear(symbol) {

        delete this.current[symbol];

    }

}