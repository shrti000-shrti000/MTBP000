/**
 * ============================================================
 * MTBP - MACD Indicator
 *
 * Moving Average Convergence Divergence
 * ============================================================
 */

import { BaseIndicator } from "../core/BaseIndicator.js";


export default class MACD extends BaseIndicator {


    constructor(options = {}) {

        super({
            name: "MACD",
            period: options.slowPeriod || 26
        });


        this.fastPeriod =
            options.fastPeriod || 12;

        this.slowPeriod =
            options.slowPeriod || 26;

        this.signalPeriod =
            options.signalPeriod || 9;


        this.fastMultiplier =
            2 / (this.fastPeriod + 1);

        this.slowMultiplier =
            2 / (this.slowPeriod + 1);

        this.signalMultiplier =
            2 / (this.signalPeriod + 1);


        this.fastSum = 0;
        this.fastCount = 0;

        this.slowSum = 0;
        this.slowCount = 0;


        this.fastEMA = null;
        this.slowEMA = null;

        this.signalEMA = null;

        this.signalBuffer = [];


        this.macd = null;
        this.signal = null;
        this.histogram = null;

    }



    /**
     * ============================================================
     * UPDATE
     *
     * Uses one CLOSED candle.
     * ============================================================
     */

    update(candle) {

        if (!candle) {
            return null;
        }


        if (this.isDuplicateCandle(candle)) {
            return null;
        }


        const close =
            Number(candle.close);


        if (!Number.isFinite(close)) {
            return null;
        }


        const candleTime =
            this.getCandleTime(candle);


        // ========================================================
        // FAST EMA
        // ========================================================

        if (this.fastEMA === null) {

            this.fastSum += close;

            this.fastCount++;


            if (
                this.fastCount ===
                this.fastPeriod
            ) {

                this.fastEMA =
                    this.fastSum /
                    this.fastPeriod;

            }

        }

        else {

            this.fastEMA =
                (
                    (close - this.fastEMA) *
                    this.fastMultiplier
                ) +
                this.fastEMA;

        }



        // ========================================================
        // SLOW EMA
        // ========================================================

        if (this.slowEMA === null) {

            this.slowSum += close;

            this.slowCount++;


            if (
                this.slowCount ===
                this.slowPeriod
            ) {

                this.slowEMA =
                    this.slowSum /
                    this.slowPeriod;

            }

        }

        else {

            this.slowEMA =
                (
                    (close - this.slowEMA) *
                    this.slowMultiplier
                ) +
                this.slowEMA;

        }



        // ========================================================
        // WAIT UNTIL BOTH EMA EXIST
        // ========================================================

        if (
            this.fastEMA === null ||
            this.slowEMA === null
        ) {

            return null;

        }



        // ========================================================
        // MACD LINE
        // ========================================================

        this.macd =
            this.fastEMA -
            this.slowEMA;



        // ========================================================
        // SIGNAL EMA
        // ========================================================

        if (this.signalEMA === null) {

            this.signalBuffer.push(
                this.macd
            );


            if (
                this.signalBuffer.length <
                this.signalPeriod
            ) {

                return null;

            }


            const sum =
                this.signalBuffer.reduce(
                    (a, b) => a + b,
                    0
                );


            this.signalEMA =
                sum /
                this.signalPeriod;

        }

        else {

            this.signalEMA =
                (
                    (this.macd - this.signalEMA) *
                    this.signalMultiplier
                ) +
                this.signalEMA;

        }



        // ========================================================
        // SIGNAL
        // ========================================================

        this.signal =
            this.signalEMA;



        // ========================================================
        // HISTOGRAM
        // ========================================================

        this.histogram =
            this.macd -
            this.signal;



        // ========================================================
        // RESULT
        // ========================================================

        const result = {

            macd:
                this.macd,

            signal:
                this.signal,

            histogram:
                this.histogram

        };



        // ========================================================
        // STORE IN BASE INDICATOR
        // ========================================================

        this.setValue(
            result,
            candleTime
        );



        // ========================================================
        // IMPORTANT
        //
        // IndicatorDispatcher.update()
        // needs this returned object.
        // ========================================================

        return result;

    }



    /**
     * ============================================================
     * GET MACD
     * ============================================================
     */

    getMACD() {

        return {

            macd:
                this.macd,

            signal:
                this.signal,

            histogram:
                this.histogram

        };

    }



    /**
     * ============================================================
     * RESET
     * ============================================================
     */

    reset() {

        super.reset();


        this.fastSum = 0;
        this.fastCount = 0;


        this.slowSum = 0;
        this.slowCount = 0;


        this.fastEMA = null;
        this.slowEMA = null;


        this.signalEMA = null;


        this.signalBuffer = [];


        this.macd = null;
        this.signal = null;
        this.histogram = null;

    }

}