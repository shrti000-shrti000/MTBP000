/**
 * ============================================================
 * MTBP - Signal Memory
 *
 * Keeps the latest signal for every exchange, symbol and timeframe.
 * Values stored in memory and PostgreSQL are normalized to a signal
 * string (for example: LONG, SHORT, NEUTRAL).
 * ============================================================
 */

import SignalMemoryRepository from "../storage/repositories/SignalMemoryRepository.js";

class SignalMemory {
    constructor() {
        this.memory = new Map();
        this.repository = SignalMemoryRepository;
        this.ready = this.load();
    }

    normalizeSignal(value) {
        const signal = (
            value && typeof value === "object"
                ? value.signal
                : value
        );

        if (typeof signal !== "string") {
            return null;
        }

        const normalized = signal.trim().toUpperCase();

        return normalized || null;
    }

    async load() {
        const rows = await this.repository.getAll();

        for (const row of rows) {
            const key = this.buildKey(
                row.exchange,
                row.symbol,
                row.timeframe
            );

            const signal = this.normalizeSignal(row.signal);

            if (signal !== null) {
                this.memory.set(key, signal);
            }
        }

        return true;
    }

    buildKey(exchange, symbol, timeframe) {
        return `${exchange}:${symbol}:${timeframe}`;
    }

    async get(exchange, symbol, timeframe) {
        const key = this.buildKey(exchange, symbol, timeframe);

        if (this.memory.has(key)) {
            return this.memory.get(key);
        }

        const row = await this.repository.get(
            exchange,
            symbol,
            timeframe
        );

        if (!row) {
            return null;
        }

        const signal = this.normalizeSignal(row.signal);

        if (signal !== null) {
            this.memory.set(key, signal);
        }

        return signal;
    }

    async set(exchange, symbol, timeframe, signal) {
        const key = this.buildKey(exchange, symbol, timeframe);
        const normalizedSignal = this.normalizeSignal(signal);

        if (normalizedSignal === null) {
            throw new TypeError(
                "SignalMemory.set requires a signal string or an object with a string signal property."
            );
        }

        this.memory.set(key, normalizedSignal);

        await this.repository.save(
            exchange,
            symbol,
            timeframe,
            normalizedSignal
        );

        return normalizedSignal;
    }

    clear() {
        this.memory.clear();
    }
}

export default new SignalMemory();
