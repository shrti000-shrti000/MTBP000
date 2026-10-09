
import db from "../database/Database.js";

class IndicatorRepository {

    constructor() {

        this.table = "indicator_store";

    }


    // =====================================
    // UPSERT INDICATOR
    // =====================================

    async upsert({
        exchange,
        symbol,
        timeframe,
        indicator,
        value
    }) {

        const query = `
            INSERT INTO ${this.table}
            (
                exchange,
                symbol,
                timeframe,
                indicator,
                value,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())

            ON CONFLICT (
                exchange,
                symbol,
                timeframe,
                indicator
            )

            DO UPDATE SET
                value = EXCLUDED.value,
                updated_at = NOW()

            RETURNING *
        `;


        const result =
            await db.query(
                query,
                [
                    exchange,
                    symbol,
                    timeframe,
                    indicator,
                    value
                ]
            );


        return result.rows[0] ?? null;

    }


    // =====================================
    // FIND ONE
    // =====================================

    async findOne({
        exchange,
        symbol,
        timeframe,
        indicator
    }) {

        const query = `
            SELECT *
            FROM ${this.table}

            WHERE exchange = $1
            AND symbol = $2
            AND timeframe = $3
            AND indicator = $4

            LIMIT 1
        `;


        const result =
            await db.query(
                query,
                [
                    exchange,
                    symbol,
                    timeframe,
                    indicator
                ]
            );


        return result.rows[0] ?? null;

    }


    // =====================================
    // GET ALL
    // =====================================

    async findAll() {

        const result =
            await db.query(
                `
                SELECT *
                FROM ${this.table}
                ORDER BY updated_at DESC
                `
            );


        return result.rows;

    }


    // =====================================
    // DELETE ONE
    // =====================================

    async remove({
        exchange,
        symbol,
        timeframe,
        indicator
    }) {

        const result =
            await db.query(
                `
                DELETE FROM ${this.table}

                WHERE exchange = $1
                AND symbol = $2
                AND timeframe = $3
                AND indicator = $4

                RETURNING *
                `,
                [
                    exchange,
                    symbol,
                    timeframe,
                    indicator
                ]
            );


        return result.rows[0] ?? null;

    }

}


export default new IndicatorRepository();
