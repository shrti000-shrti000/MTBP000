import PostgresAdapter from "../database/PostgresAdapter.js";

class StrategyStateRepository {

    constructor() {

        this.table = "strategy_state";

    }


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



    async save(
        exchange,
        symbol,
        timeframe,
        state
    ) {

        const result =
            await PostgresAdapter.query(
                `
                INSERT INTO ${this.table}
                (
                    exchange,
                    symbol,
                    timeframe,
                    state
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

                    state=$4,

                    updated_at=NOW()

                RETURNING *
                `,
                [
                    exchange,
                    symbol,
                    timeframe,
                    state
                ]
            );


        return result.rows[0];

    }



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


    async clear() {

        await PostgresAdapter.query(
            `
            DELETE FROM ${this.table}
            `
        );

        return true;

    }

}


export default new StrategyStateRepository();