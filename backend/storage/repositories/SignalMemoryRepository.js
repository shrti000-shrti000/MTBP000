import PostgresAdapter from "../database/PostgresAdapter.js";


class SignalMemoryRepository {


    constructor() {

        this.table = "signal_memory";

    }



    // =====================================
    // LOAD SIGNAL
    // =====================================

    async get(
        exchange,
        symbol,
        timeframe
    ) {


        const result =
            await PostgresAdapter.query(
                `
                SELECT *
                FROM ${this.table}
                WHERE exchange=$1
                AND symbol=$2
                AND timeframe=$3
                `,
                [
                    exchange,
                    symbol,
                    timeframe
                ]
            );


        return result.rows[0] ?? null;

    }



    // =====================================
    // SAVE SIGNAL
    // =====================================

    async save(
        exchange,
        symbol,
        timeframe,
        signal
    ) {


        const result =
            await PostgresAdapter.query(
                `
                INSERT INTO ${this.table}
                (
                    exchange,
                    symbol,
                    timeframe,
                    signal
                )
                VALUES
                ($1,$2,$3,$4)

                ON CONFLICT
                (
                    exchange,
                    symbol,
                    timeframe
                )

                DO UPDATE SET

                    signal=$4,

                    updated_at=NOW()

                RETURNING *
                `,
                [
                    exchange,
                    symbol,
                    timeframe,
                    signal
                ]
            );


        return result.rows[0];

    }



    // =====================================
// LOAD ALL SIGNALS
// =====================================

async getAll() {

    const result =
        await PostgresAdapter.query(
            `
            SELECT *
            FROM ${this.table}
            `
        );

    return result.rows;

}

    // =====================================
    // CLEAR
    // =====================================

    async clear() {

        await PostgresAdapter.query(
            `
            DELETE FROM ${this.table}
            `
        );


        return true;

    }


}


export default new SignalMemoryRepository();