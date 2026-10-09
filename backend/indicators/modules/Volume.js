/**
 * ============================================================
 * MTBP - Volume Indicator
 *
 * Volume Moving Average / Relative Volume
 * ============================================================
 */

import { BaseIndicator } from "../core/BaseIndicator.js";

export default class Volume extends BaseIndicator {

    constructor(options = {}) {

        super({
            name: "Volume",
            period: options.period || 20
        });

        this.volumes = [];
        this.totalVolume = 0;

        this.currentVolume = 0;
        this.averageVolume = 0;
        this.relativeVolume = 0;

    }

    /**
     * Update using one CLOSED candle.
     *
     * Relative Volume is calculated against the
     * PREVIOUS `period` candles.
     *
     * The current candle is NOT included in the
     * reference average.
     */
    update(candle) {

        if (!candle) return;

        if (this.isDuplicateCandle(candle)) {
            return;
        }

        if (typeof candle.volume !== "number") {
            return;
        }

        const volume = Number(candle.volume);

        const candleTime =
            this.getCandleTime(candle);

        this.currentVolume = volume;

        /*
         * Calculate the average using only the
         * previous `period` candles.
         *
         * This keeps Production behavior aligned
         * with CalibrationEngine.calculateVolumeRelative().
         */
        if (this.volumes.length >= this.period) {

            this.averageVolume =
                this.totalVolume / this.volumes.length;

            if (this.averageVolume === 0) {

                this.relativeVolume = 0;

            } else {

                this.relativeVolume =
                    this.currentVolume /
                    this.averageVolume;

            }

        } else {

            /*
             * Not enough historical candles yet.
             */
            this.averageVolume = 0;
            this.relativeVolume = 0;

        }

        /*
         * Only after calculating the relative volume,
         * add the current candle to the historical window.
         */
        this.volumes.push(volume);

        this.totalVolume += volume;

        /*
         * Keep the previous-volume window fixed.
         */
        if (this.volumes.length > this.period) {

            this.totalVolume -=
                this.volumes.shift();

        }

        this.setValue(
            {
                current: this.currentVolume,
                average: this.averageVolume,
                relative: this.relativeVolume
            },
            candleTime
        );

    }

    /**
     * Latest Volume data.
     */
    getVolume() {

        return {

            current: this.currentVolume,

            average: this.averageVolume,

            relative: this.relativeVolume

        };

    }

    /**
     * Reset.
     */
    reset() {

        super.reset();

        this.volumes = [];

        this.totalVolume = 0;

        this.currentVolume = 0;

        this.averageVolume = 0;

        this.relativeVolume = 0;

    }

}
