/**

* ============================================================
* MTBP - IndicatorStore
*
* Stores latest calculated indicator values.
*
* Structure:
*
* Exchange
* └── Symbol
* ```
  └── Timeframe
  ```
* ```
      └── Indicator
  ```
*
* Persistence:
*
* RAM
* ↓
* PostgreSQL
*
* PostgreSQL
* ↓
* RAM on startup
*
* ============================================================
  */

import IndicatorRepository from "../../storage/repositories/IndicatorRepository.js";

class IndicatorStore {

constructor() {

    this.store =
        new Map();


    // ==========================================
    // DATABASE READY
    // ==========================================

    this.ready =
        this.loadFromDatabase();


    // ==========================================
    // PERSISTENCE QUEUE
    //
    // جلوگیری از ارسال همزمان تعداد بسیار زیاد
    // Query به PostgreSQL
    // ==========================================

    this.persistQueue =
        Promise.resolve();

}



// ============================================================
// BUILD KEY
// ============================================================

buildKey(
    exchange,
    symbol,
    timeframe
) {

    return `${exchange}:${symbol}:${timeframe}`;

}



// ============================================================
// LOAD FROM DATABASE
// ============================================================

async loadFromDatabase() {

    try {

        const rows =
            await IndicatorRepository.findAll();


        if (!Array.isArray(rows)) {

            return;

        }


        for (const row of rows) {

            const key =
                this.buildKey(
                    row.exchange,
                    row.symbol,
                    row.timeframe
                );


            if (!this.store.has(key)) {

                this.store.set(
                    key,
                    {}
                );

            }


            const indicators =
                this.store.get(key);


            // ======================================
            // DO NOT OVERWRITE A VALID RAM VALUE
            // ======================================

            const currentValue =
                indicators[row.indicator];


            if (
                currentValue === undefined ||
                currentValue === null
            ) {

                if (
                    row.value !== null &&
                    row.value !== undefined
                ) {

                    indicators[row.indicator] =
                        row.value;

                }

            }

        }

    }
    catch (error) {

        console.error(
            "❌ INDICATOR STORE DATABASE LOAD ERROR:",
            error.message
        );

    }

}



// ============================================================
// SAVE TO DATABASE
// ============================================================

async persist(
    exchange,
    symbol,
    timeframe,
    indicator,
    value
) {

    // ==========================================
    // ADD TO SERIAL PERSISTENCE QUEUE
    // ==========================================

    this.persistQueue =
        this.persistQueue.then(
            async () => {

                try {

                    await IndicatorRepository.upsert({

                        exchange,

                        symbol,

                        timeframe,

                        indicator,

                        value

                    });

                }
                catch (error) {

                    console.error(
                        "❌ INDICATOR STORE PERSIST ERROR:",
                        error.message
                    );

                }

            }
        );


    return this.persistQueue;

}



// ============================================================
// SET
// ============================================================

set(
    exchange,
    symbol,
    timeframe,
    indicator,
    value
) {

    const key =
        this.buildKey(
            exchange,
            symbol,
            timeframe
        );


    if (!this.store.has(key)) {

        this.store.set(
            key,
            {}
        );

    }


    const indicators =
        this.store.get(key);


    // ==========================================
    // UPDATE RAM IMMEDIATELY
    // ==========================================

    indicators[indicator] =
        value;


    // ==========================================
    // PERSIST TO POSTGRES
    // ==========================================

    this.persist(
        exchange,
        symbol,
        timeframe,
        indicator,
        value
    );


    return value;

}



// ============================================================
// GET ONE INDICATOR
// ============================================================

get(
    exchange,
    symbol,
    timeframe,
    indicator
) {

    const key =
        this.buildKey(
            exchange,
            symbol,
            timeframe
        );


    if (!this.store.has(key)) {

        return null;

    }


    return (
        this.store.get(key)[indicator]
        ??
        null
    );

}



// ============================================================
// GET ALL INDICATORS
// ============================================================

getAll(
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


    if (!this.store.has(key)) {

        return {};

    }


    return this.store.get(key);

}



// ============================================================
// HAS
// ============================================================

has(
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


    return this.store.has(key);

}



// ============================================================
// REMOVE
// ============================================================

remove(
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


    this.store.delete(key);

}



// ============================================================
// CLEAR
// ============================================================

clear() {

    this.store.clear();

}



// ============================================================
// SIZE
// ============================================================

size() {

    return this.store.size;

}



// ============================================================
// KEYS
// ============================================================

keys() {

    return [
        ...this.store.keys()
    ];

}


}

export default new IndicatorStore();
