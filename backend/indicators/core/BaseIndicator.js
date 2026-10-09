/**
 * ============================================================
 * MTBP - BaseIndicator
 *
 * Base class for all indicators.
 * ============================================================
 */

export class BaseIndicator {

    constructor(options = {}) {

        this.name = options.name || "BaseIndicator";
        this.period = options.period || 0;

        this.initialized = false;

        // Last processed candle time
        this.lastCandleTime = null;

        // Latest indicator value
        this.currentValue = null;

        // Indicator history
        this.history = [];

    }

    /**
     * Must be implemented by child classes.
     */
    update(candle) {
        throw new Error(`${this.name}: update() must be implemented.`);
    }

    /**
     * Returns candle timestamp.
     */
    getCandleTime(candle) {

        return (
            candle?.closeTime ??
            candle?.time ??
            candle?.timestamp ??
            candle?.openTime ??
            null
        );

    }

    /**
     * Returns true if candle already processed.
     */
    isDuplicateCandle(candle) {

        const time = this.getCandleTime(candle);

        if (time == null) {
            return false;
        }

        return time === this.lastCandleTime;

    }

    /**
     * Save latest indicator value.
     */
    setValue(value, candleTime = null) {

        this.currentValue = value;

        if (candleTime != null) {
            this.lastCandleTime = candleTime;
        }

        this.history.push({

            time: this.lastCandleTime,

            value,

        });

        this.initialized = true;

    }

    /**
     * Latest value.
     */
    getValue() {
        return this.currentValue;
    }

    /**
     * History.
     */
    getHistory() {
        return this.history;
    }

    /**
     * Last candle time.
     */
    getLastCandleTime() {
        return this.lastCandleTime;
    }

    /**
     * Initialized?
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Reset.
     */
    reset() {

        this.initialized = false;

        this.lastCandleTime = null;

        this.currentValue = null;

        this.history = [];

    }

}