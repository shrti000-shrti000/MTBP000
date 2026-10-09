/**
 * ============================================================
 * MTBP - Indicator Engine
 *
 * Entry Point
 * ============================================================
 */

import IndicatorManager from "./core/IndicatorManager.js";

import EMA from "./modules/EMA.js";
import RSI from "./modules/RSI.js";
import MACD from "./modules/MACD.js";
import Volume from "./modules/Volume.js";
import ATR from "./modules/ATR.js";


/**
 * Register all indicators.
 */
export function initialize() {

    IndicatorManager.register(
        "EMA",
        EMA
    );

    IndicatorManager.register(
        "RSI",
        RSI
    );

    IndicatorManager.register(
        "MACD",
        MACD
    );

    IndicatorManager.register(
        "Volume",
        Volume
    );

    IndicatorManager.register(
        "ATR",
        ATR
    );


    return IndicatorManager;
}


export {
    IndicatorManager,
    EMA,
    RSI,
    MACD,
    Volume,
    ATR
};


export default {
    initialize,
    IndicatorManager,
    EMA,
    RSI,
    MACD,
    Volume,
    ATR
};