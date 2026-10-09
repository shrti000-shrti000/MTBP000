// ============================================================
// MTBP - Indicator Dispatcher
//
// Bridge between Candle Engine and Indicator Engine
//
// Flow:
//
// Closed Candle
//      ↓
// IndicatorDispatcher
//      ↓
// IndicatorManager
//      ↓
// IndicatorCache
//      ↓
// Indicator Instance
//      ↓
// IndicatorStore
//
// ============================================================

import IndicatorManager from "./core/IndicatorManager.js";
import IndicatorStore from "./core/IndicatorStore.js";
import strategySettings from "../config/strategySettings.js";
import riskSettings from "../config/riskSettings.js";
import ATR from "./modules/ATR.js";

//const DEBUG = false;

const DEBUG = true;

class IndicatorDispatcher {

    constructor() {

        // ======================================================
        // CACHE ACTIVE INDICATORS
        // ======================================================

        this.indicatorConfig = null;


        // ======================================================
        // TRAILING ATR INSTANCES
        //
        // ATR مربوط به Stop Loss از ATR معمولی جداست.
        //
        // ATR:
        //      riskSettings.stopLoss.atrPeriod
        //
        // TRAILING_ATR:
        //      riskSettings.trailing.atrPeriod
        //
        // Key:
        // exchange/symbol/timeframe
        // ======================================================

        this.trailingAtrInstances = new Map();

    }



    // ============================================================
    // GET TRAILING ATR INSTANCE
    // ============================================================

    getTrailingATRInstance(
        exchange,
        symbol,
        timeframe,
        period
    ) {

        const key =
            `${exchange}/${symbol}/${timeframe}`;


        let instance =
            this.trailingAtrInstances.get(key);


        // --------------------------------------------------------
        // Existing instance
        // --------------------------------------------------------

        if (
            instance &&
            Number(instance.period) === Number(period)
        ) {

            return instance;

        }


        // --------------------------------------------------------
        // Create new instance
        // --------------------------------------------------------

        instance =
            new ATR({

                period:
                    Number(period) || 30

            });


        this.trailingAtrInstances.set(
            key,
            instance
        );


        return instance;

    }



    // ============================================================
    // BUILD INDICATOR CONFIG
    // ============================================================

    buildIndicatorConfig() {

        const indicators = [];


        // ========================================================
        // RSI
        // ========================================================

        if (
            strategySettings.rsi?.enabled === true
        ) {

            indicators.push({

                name: "RSI",

                indicator: "RSI",

                options: {

                    period:
                        Number(
                            strategySettings.rsi.period
                        ) || 14

                }

            });

        }



        // ========================================================
        // EMA
        // ========================================================

        if (
            strategySettings.ema?.enabled === true
        ) {

            indicators.push({

                name: "EMA_FAST",

                indicator: "EMA",

                options: {

                    period:
                        Number(
                            strategySettings.ema.fast
                        ) || 20

                }

            });


            indicators.push({

                name: "EMA_SLOW",

                indicator: "EMA",

                options: {

                    period:
                        Number(
                            strategySettings.ema.slow
                        ) || 50

                }

            });

        }



        // ========================================================
        // MACD
        // ========================================================

        if (
            strategySettings.macd?.enabled === true
        ) {

            indicators.push({

                name: "MACD",

                indicator: "MACD",

                options: {

                    fastPeriod:
                        Number(
                            strategySettings.macd.fast
                        ) || 12,

                    slowPeriod:
                        Number(
                            strategySettings.macd.slow
                        ) || 26,

                    signalPeriod:
                        Number(
                            strategySettings.macd.signal
                        ) || 9

                }

            });

        }



        // ========================================================
        // VOLUME
        // ========================================================

        if (
            strategySettings.volume?.enabled === true
        ) {

            indicators.push({

                name: "Volume",

                indicator: "Volume",

                options: {

                    period:
                        Number(
                            strategySettings.volume.period
                        ) || 20

                }

            });

        }



        // ========================================================
        // ATR
        //
        // ATR برای Risk / Stop Loss
        //
        // از Risk Settings خوانده می‌شود.
        // ========================================================

        const stopLossAtrPeriod =
            Number(
                riskSettings.stopLoss?.atrPeriod
            ) || 10;


        indicators.push({

            name: "ATR",

            indicator: "ATR",

            options: {

                period:
                    stopLossAtrPeriod

            }

        });


        return indicators;

    }



    // ============================================================
    // GET ACTIVE INDICATORS
    // ============================================================

    getIndicators() {

        if (
            this.indicatorConfig
        ) {

            return this.indicatorConfig;

        }


        this.indicatorConfig =
            this.buildIndicatorConfig();


        return this.indicatorConfig;

    }



    // ============================================================
    // INVALIDATE CONFIG
    // ============================================================

    invalidateConfig() {

        this.indicatorConfig = null;

    }



    // ============================================================
    // NORMALIZE VALUE
    // ============================================================

    normalizeValue(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return null;

        }


        // --------------------------------------------------------
        // NUMBER
        // --------------------------------------------------------

        if (
            typeof value === "number"
        ) {

            return Number.isFinite(value)
                ? value
                : null;

        }


        // --------------------------------------------------------
        // OBJECT
        // --------------------------------------------------------

        if (
            typeof value === "object"
        ) {

            return value;

        }


        return value;

    }



    // ============================================================
    // STORE VALUE
    // ============================================================

    storeValue(
        exchange,
        symbol,
        timeframe,
        indicatorName,
        value
    ) {

        const normalized =
            this.normalizeValue(value);


        if (
            normalized === null ||
            normalized === undefined
        ) {

            return false;

        }


        IndicatorStore.set(

            exchange,

            symbol,

            timeframe,

            indicatorName,

            normalized

        );


        return true;

    }



    // ============================================================
    // STORE EMA
    // ============================================================

    storeEMA(

        exchange,

        symbol,

        timeframe,

        name,

        value,

        close

    ) {

        const numericValue =
            Number(value);


        if (
            !Number.isFinite(numericValue)
        ) {

            return false;

        }


        const numericClose =
            Number(close);


        IndicatorStore.set(

            exchange,

            symbol,

            timeframe,

            name,

            {

                value:
                    numericValue,

                priceAbove:
                    Number.isFinite(numericClose)
                        ? numericClose > numericValue
                        : null

            }

        );


        return true;

    }



    // ============================================================
    // UPDATE TRAILING ATR
    // ============================================================

    updateTrailingATR(

        exchange,
        symbol,
        timeframe,
        candle

    ) {

        try {

            // ----------------------------------------------------
            // ATR Period dedicated to Trailing Stop
            // ----------------------------------------------------

            const trailingAtrPeriod =
                Number(
                    riskSettings.trailing?.atrPeriod
                ) || 30;


            const atrInstance =
                this.getTrailingATRInstance(

                    exchange,
                    symbol,
                    timeframe,

                    trailingAtrPeriod

                );


            const atr =
                atrInstance.update(candle);


            const numericAtr =
                Number(atr);


            if (
                !Number.isFinite(numericAtr) ||
                numericAtr <= 0
            ) {

                return false;

            }


            // ----------------------------------------------------
            // Store separately from normal ATR
            // ----------------------------------------------------

            IndicatorStore.set(

                exchange,
                symbol,
                timeframe,

                "TRAILING_ATR",

                numericAtr

            );


            return true;

        }
        catch (error) {

            if (DEBUG) {

                console.error(

                    "[IndicatorDispatcher] TRAILING_ATR ERROR:",

                    error?.message ||
                    error

                );

            }


            return false;

        }

    }



    // ============================================================
    // DISPATCH ONE CLOSED CANDLE
    // ============================================================

    dispatch(

        exchange,

        symbol,

        timeframe,

        candle,

        indicators = null

    ) {


        // --------------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------------

        if (
            !candle ||
            !exchange ||
            !symbol ||
            !timeframe
        ) {

            return;

        }


        const close =
            Number(candle.close);


        if (
            !Number.isFinite(close)
        ) {

            return;

        }



        // --------------------------------------------------------
        // ACTIVE INDICATORS
        // --------------------------------------------------------

        const activeIndicators =
            indicators ??
            this.getIndicators();



        // --------------------------------------------------------
        // UPDATE NORMAL INDICATORS
        // --------------------------------------------------------

        for (
            const item
            of activeIndicators
        ) {

            try {

                const value =
                    IndicatorManager.update(

                        exchange,
                        symbol,
                        timeframe,
                        item.name,
                        candle,
                        item.options

                    );



                // ==================================================
                // EMA
                // ==================================================

                if (

                    item.name === "EMA_FAST" ||

                    item.name === "EMA_SLOW"

                ) {

                    this.storeEMA(

                        exchange,

                        symbol,

                        timeframe,

                        item.name,

                        value,

                        close

                    );

                }


                // ==================================================
                // OTHER INDICATORS
                // ==================================================

                else {

                    this.storeValue(

                        exchange,

                        symbol,

                        timeframe,

                        item.name,

                        value

                    );

                }

            }
            catch (error) {

                if (DEBUG) {

                    console.error(

                        `[IndicatorDispatcher] ${item.name} ERROR:`,

                        error?.message ||
                        error

                    );

                }

            }

        }



        // ========================================================
        // TRAILING ATR
        //
        // Separate from normal ATR.
        //
        // Normal ATR:
        //      ATR
        //
        // Trailing ATR:
        //      TRAILING_ATR
        //
        // This prevents Chandelier from accidentally using
        // the Stop Loss ATR.
        // ========================================================

        this.updateTrailingATR(

            exchange,
            symbol,
            timeframe,
            candle

        );

    }



    // ============================================================
    // CHECK CHRONOLOGICAL ORDER
    // ============================================================

    isChronological(candles) {

        if (
            candles.length < 2
        ) {

            return true;

        }


        for (
            let i = 1;
            i < candles.length;
            i++
        ) {

            const previous =
                Number(

                    candles[i - 1]?.openTime ??

                    candles[i - 1]?.closeTime ??

                    candles[i - 1]?.time ??

                    candles[i - 1]?.timestamp ??

                    0

                );


            const current =
                Number(

                    candles[i]?.openTime ??

                    candles[i]?.closeTime ??

                    candles[i]?.time ??

                    candles[i]?.timestamp ??

                    0

                );


            if (
                current < previous
            ) {

                return false;

            }

        }


        return true;

    }



    // ============================================================
    // DISPATCH HISTORICAL CANDLES
    // ============================================================

    dispatchHistory(

        exchange,

        symbol,

        timeframe,

        candles = []

    ) {

        if (

            !Array.isArray(candles) ||

            candles.length === 0

        ) {

            return;

        }



        // --------------------------------------------------------
        // ACTIVE INDICATORS
        // --------------------------------------------------------

        const indicators =
            this.getIndicators();



        // --------------------------------------------------------
        // CHRONOLOGICAL ORDER
        // --------------------------------------------------------

        let ordered =
            candles;


        if (
            !this.isChronological(candles)
        ) {

            ordered =
                [...candles].sort(

                    (a, b) => {

                        const timeA =
                            Number(

                                a?.openTime ??

                                a?.closeTime ??

                                a?.time ??

                                a?.timestamp ??

                                0

                            );


                        const timeB =
                            Number(

                                b?.openTime ??

                                b?.closeTime ??

                                b?.time ??

                                b?.timestamp ??

                                0

                            );


                        return timeA - timeB;

                    }

                );

        }



        // --------------------------------------------------------
        // REPLAY
        // --------------------------------------------------------

        for (
            const candle
            of ordered
        ) {

            this.dispatch(

                exchange,

                symbol,

                timeframe,

                candle,

                indicators

            );

        }

    }



    // ============================================================
    // DISPATCH ALL TIMEFRAMES FOR ONE SYMBOL
    // ============================================================

    dispatchSymbolHistory(

        exchange,

        symbol,

        candleStore

    ) {

        if (

            !candleStore ||

            !symbol

        ) {

            return;

        }



        // --------------------------------------------------------
        // GET TIMEFRAMES
        // --------------------------------------------------------

        const timeframes =

            typeof candleStore.getTimeframes === "function"

                ? candleStore.getTimeframes()

                : [];


        if (
            !Array.isArray(timeframes)
        ) {

            return;

        }



        // --------------------------------------------------------
        // ACTIVE INDICATORS
        // --------------------------------------------------------

        const indicators =
            this.getIndicators();



        // --------------------------------------------------------
        // EACH TIMEFRAME
        // --------------------------------------------------------

        for (
            const timeframe
            of timeframes
        ) {

            const candles =

                typeof candleStore.get === "function"

                    ? candleStore.get(

                        symbol,

                        timeframe

                    )

                    : [];


            if (

                !Array.isArray(candles) ||

                candles.length === 0

            ) {

                continue;

            }


            this.dispatchHistory(

                exchange,

                symbol,

                timeframe,

                candles

            );

        }

    }



    // ============================================================
    // RESET ONE INDICATOR
    // ============================================================

    reset(

        exchange,

        symbol,

        timeframe,

        name

    ) {

        IndicatorManager.reset(

            exchange,

            symbol,

            timeframe,

            name

        );


        // --------------------------------------------------------
        // Reset dedicated TRAILING_ATR instance
        // --------------------------------------------------------

        if (
            name === "TRAILING_ATR"
        ) {

            const key =
                `${exchange}/${symbol}/${timeframe}`;


            this.trailingAtrInstances.delete(key);


            IndicatorStore.set(

                exchange,
                symbol,
                timeframe,

                "TRAILING_ATR",

                null

            );

        }

    }



    // ============================================================
    // CLEAR ALL
    // ============================================================

    clear() {

        IndicatorManager.clear();

        this.indicatorConfig = null;

        this.trailingAtrInstances.clear();

    }

}



export default new IndicatorDispatcher();