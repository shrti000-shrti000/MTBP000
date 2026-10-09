/**
 * ============================================================
 * MTBP - EMA Indicator
 *
 * Exponential Moving Average
 * ============================================================
 */

import { BaseIndicator } from "../core/BaseIndicator.js";

export default class EMA extends BaseIndicator {

    constructor(options = {}) {

        super({
            name: "EMA",
            period: options.period || 20
        });

        this.multiplier = 2 / (this.period + 1);

        this.sum = 0;
        this.count = 0;

        this.ema = null;

    }

    /**
     * Update EMA using one CLOSED candle.
     */
    update(candle) {

        if (!candle) return;

        if (this.isDuplicateCandle(candle)) {
            return;
        }

        //if (typeof candle.close !== "number") {
           // return;
        //}

        //const close = Number(candle.close);


        const close = Number(candle.close);

if (!Number.isFinite(close)) {
    return;
}



        const candleTime =
            this.getCandleTime(candle);

        // Build initial SMA

        if (!this.initialized) {

            this.sum += close;

            this.count++;

            if (this.count < this.period) {
                return;
            }

            this.ema =
                this.sum / this.period;

            this.setValue(
                this.ema,
                candleTime
            );

            return;

        }

        // Incremental EMA

        this.ema =
            ((close - this.ema) * this.multiplier) +
            this.ema;

        this.setValue(
            this.ema,
            candleTime
        );

    }

    /**
     * Latest EMA value.
     */
    getEMA() {

        return this.ema;

    }

    /**
     * Reset indicator.
     */
    reset() {

        super.reset();

        this.sum = 0;

        this.count = 0;

        this.ema = null;

    }

}