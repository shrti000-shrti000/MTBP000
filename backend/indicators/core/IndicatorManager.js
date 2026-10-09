/**
 * ============================================================
 * MTBP - IndicatorManager
 *
 * Controls all indicator instances.
 *
 * Flow:
 *
 * Closed Candle
 *
 *      ↓
 *
 * IndicatorManager
 *
 *      ↓
 *
 * IndicatorCache
 *
 *      ↓
 *
 * Indicator.update()
 *
 *      ↓
 *
 * IndicatorDispatcher
 *
 *      ↓
 *
 * IndicatorStore
 *
 * ============================================================
 */


import IndicatorCache from "./IndicatorCache.js";
import IndicatorStore from "./IndicatorStore.js";

const DEBUG = false;


class IndicatorManager {


constructor() {

    this.registry = new Map();

}



/**
 * Register indicator class.
 *
 * Example:
 *
 * register("RSI", RSI);
 *
 */


register(
    name,
    IndicatorClass
) {

    this.registry.set(
        name,
        IndicatorClass
    );

}



/**
 * Create or return indicator instance.
 */


getInstance(
    exchange,
    symbol,
    timeframe,
    name,
    options = {}
) {


    let instance =
        IndicatorCache.get(
            exchange,
            symbol,
            timeframe,
            name
        );


    if (instance) {

        return instance;

    }



    // ============================
    // FIND INDICATOR CLASS
    // ============================

    let IndicatorClass =
        this.registry.get(name);



    // EMA_FAST / EMA_SLOW
    // use EMA class

    if (
        !IndicatorClass &&
        name.startsWith("EMA")
    ) {

        IndicatorClass =
            this.registry.get("EMA");

    }



    if (!IndicatorClass) {

        throw new Error(
            `Indicator "${name}" is not registered.`
        );

    }



    if (DEBUG) {

        // console.log(
        //     "🔥 CREATE INDICATOR",
        //     name,
        //     options
        // );

    }



    instance =
        new IndicatorClass(
            options
        );



    IndicatorCache.set(
        exchange,
        symbol,
        timeframe,
        name,
        instance
    );



    return instance;

}



/**
 * Update one indicator.
 */


update(
    exchange,
    symbol,
    timeframe,
    name,
    candle,
    options = {}
) {


    const indicator =
        this.getInstance(
            exchange,
            symbol,
            timeframe,
            name,
            options
        );



    // ========================================================
    // UPDATE INDICATOR
    //
    // IndicatorManager فقط مسئول محاسبه است.
    //
    // ذخیره در IndicatorStore توسط
    // IndicatorDispatcher انجام می‌شود.
    //
    // جلوگیری از ذخیره دوباره.
    // ========================================================

    indicator.update(candle);


    return indicator.getValue();

}



/**
 * Get latest value.
 */


get(
    exchange,
    symbol,
    timeframe,
    name
) {


    return IndicatorStore.get(
        exchange,
        symbol,
        timeframe,
        name
    );

}



/**
 * Get all values.
 */


getAll(
    exchange,
    symbol,
    timeframe
) {


    return IndicatorStore.getAll(
        exchange,
        symbol,
        timeframe
    );

}



/**
 * Reset indicator.
 */


reset(
    exchange,
    symbol,
    timeframe,
    name
) {


    const indicator =
        IndicatorCache.get(
            exchange,
            symbol,
            timeframe,
            name
        );



    if (indicator) {


        if (
            typeof indicator.reset === "function"
        ) {

            indicator.reset();

        }

    }



    IndicatorCache.remove(
        exchange,
        symbol,
        timeframe,
        name
    );

}



/**
 * Clear all.
 */


clear() {

    IndicatorCache.clear();

    IndicatorStore.clear();

}


}


export default new IndicatorManager();