import StrategySettingsRepository
    from "../storage/repositories/StrategySettingsRepository.js";


class StrategySettingsStore {


    constructor() {

        // =====================================
        // IN-MEMORY SETTINGS
        // =====================================

        this.settings = new Map();


        // =====================================
        // REPOSITORY
        // =====================================

        this.repository =
            StrategySettingsRepository;


        // =====================================
        // BOOT LOAD
        // =====================================

        this.ready =
            this.load();

    }


    // =====================================
    // BUILD KEY
    // =====================================

    buildKey(
        exchange,
        symbol,
        timeframe
    ) {

        return `${exchange}:${symbol}:${timeframe}`;

    }


    // =====================================
    // LOAD ALL SETTINGS FROM DATABASE
    // =====================================

    async load() {

        const rows =
            await this.repository.findAll();


        for (const row of rows) {

            const key =
                this.buildKey(
                    row.exchange,
                    row.symbol,
                    row.timeframe
                );


            this.settings.set(
                key,
                row
            );

        }


        return rows.length;

    }


    // =====================================
    // GET ONE
    // =====================================

    get(
        exchange,
        symbol,
        timeframe
    ) {

        const key =
            this.buildKey(
                exchange,
                symbol,
                timeframe
            );


        return (
            this.settings.get(key) ??
            null
        );

    }


    // =====================================
    // SET / PERSIST ONE
    // =====================================

    async set(settings) {

        const saved =
            await this.repository.upsert(
                settings
            );


        const key =
            this.buildKey(
                saved.exchange,
                saved.symbol,
                saved.timeframe
            );


        this.settings.set(
            key,
            saved
        );


        return saved;

    }


    // =====================================
    // REMOVE ONE
    // =====================================

    async remove(
        exchange,
        symbol,
        timeframe
    ) {

        const removed =
            await this.repository.remove(
                exchange,
                symbol,
                timeframe
            );


        const key =
            this.buildKey(
                exchange,
                symbol,
                timeframe
            );


        this.settings.delete(key);


        return removed;

    }


    // =====================================
    // CLEAR RAM
    // =====================================

    clear() {

        this.settings.clear();

    }


    // =====================================
    // GET ALL FROM RAM
    // =====================================

    getAll() {

        return Array.from(
            this.settings.values()
        );

    }

}


export default new StrategySettingsStore();