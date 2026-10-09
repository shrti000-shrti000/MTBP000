/**
 * ============================================================
 * MTBP - RSI Indicator
 *
 * Relative Strength Index (Wilder)
 * ============================================================
 */

import { BaseIndicator } from "../core/BaseIndicator.js";

export default class RSI extends BaseIndicator {

    constructor(options = {}) {

        super({
            name: "RSI",
            period: options.period || 14
        });

        this.previousClose = null;

        this.avgGain = 0;
        this.avgLoss = 0;

        this.gainSum = 0;
        this.lossSum = 0;

        this.counter = 0;

        this.rsi = null;

    }

    /**
     * Update RSI using one CLOSED candle.
     */
    update(candle) {

        if (!candle) return;

        if (this.isDuplicateCandle(candle)) {
            return;
        }

        //if (typeof candle.close !== "number") {
        //    return;
        //}

        //const close = Number(candle.close);



        const close = Number(candle.close);

if (!Number.isFinite(close)) {
    return;
}




        const candleTime =
            this.getCandleTime(candle);

        // First candle

        if (this.previousClose === null) {

            this.previousClose = close;

            return;

        }

        const change =
            close - this.previousClose;

        const gain =
            change > 0 ? change : 0;

        const loss =
            change < 0 ? Math.abs(change) : 0;

        // Build initial averages

        if (!this.initialized) {

            this.gainSum += gain;
            this.lossSum += loss;

            this.counter++;

            this.previousClose = close;

            if (this.counter < this.period) {
                return;
            }

            this.avgGain =
                this.gainSum / this.period;

            this.avgLoss =
                this.lossSum / this.period;

            this.calculateRSI(
                candleTime
            );

            return;

        }

        // Wilder smoothing

        this.avgGain =
            (
                (this.avgGain * (this.period - 1))
                + gain
            ) / this.period;

        this.avgLoss =
            (
                (this.avgLoss * (this.period - 1))
                + loss
            ) / this.period;

        this.previousClose = close;

        this.calculateRSI(
            candleTime
        );

    }

    /**
     * Calculate RSI value.
     */
    calculateRSI(candleTime) {

        if (this.avgLoss === 0) {

            this.rsi = 100;

        } else {

            const rs =
                this.avgGain / this.avgLoss;

            this.rsi =
                100 - (100 / (1 + rs));

        }

        this.setValue(
            this.rsi,
            candleTime
        );

    }

    /**
     * Latest RSI value.
     */
    getRSI() {

        return this.rsi;

    }

    /**
     * Reset indicator.
     */
    reset() {

        super.reset();

        this.previousClose = null;

        this.avgGain = 0;
        this.avgLoss = 0;

        this.gainSum = 0;
        this.lossSum = 0;

        this.counter = 0;

        this.rsi = null;

    }

}