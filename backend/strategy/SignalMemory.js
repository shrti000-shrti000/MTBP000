/**
 * ============================================================
 * MTBP - Signal Memory
 *
 * Keeps last signal for every:
 *
 * exchange
 * symbol
 * timeframe
 *
 * ============================================================
 */

import SignalMemoryRepository from "../storage/repositories/SignalMemoryRepository.js";

class SignalMemory {
    constructor() {
        this.memory = new Map();
        this.repository = SignalMemoryRepository;
        this.ready = this.load();
    }

    async load() {
        const rows = await this.repository.getAll();

        for (const row of rows) {
            const key = this.buildKey(
                row.exchange,
                row.symbol,
                row.timeframe
            );

            this.memory.set(key, row.signal);
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

        if (row) {
            this.memory.set(key, row.signal);
            return row.signal;
        }

        return null;
    }

    async set(exchange, symbol, timeframe, signal) {
        const key = this.buildKey(exchange, symbol, timeframe);

        this.memory.set(key, signal);

        await this.repository.save(
            exchange,
            symbol,
            timeframe,
            signal
        );
    }

    clear() {
        this.memory.clear();
    }
}

export default new SignalMemory();
