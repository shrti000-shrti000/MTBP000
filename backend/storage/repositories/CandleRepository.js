import db from "../database/Database.js";

class CandleRepository {

    constructor() {
        this.table = "candles";
    }


    // =====================================
    // UPSERT CANDLE
    // =====================================

    async upsert(candle) {

        const query = `
            INSERT INTO ${this.table}
            (
                exchange,
                symbol,
                timeframe,
                open_time,
                open,
                high,
                low,
                close,
                volume,
                updated_at
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                NOW()
            )

            ON CONFLICT
            (
                exchange,
                symbol,
                timeframe,
                open_time
            )

            DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                volume = EXCLUDED.volume,
                updated_at = NOW()

            RETURNING *
        `;

        const result = await db.query(
            query,
            [
                candle.exchange,
                candle.symbol,
                candle.timeframe,
                candle.openTime ?? candle.open_time,
                candle.open,
                candle.high,
                candle.low,
                candle.close,
                candle.volume
            ]
        );

        return result.rows[0] ?? null;
    }


    // =====================================
    // GET RECENT CANDLES FOR ALL
    //
    // فقط آخرین 500 کندل برای هر
    // Exchange + Symbol + Timeframe
    //
    // جلوگیری از LOAD کل دیتابیس در RAM
    // =====================================
async findAll() {

    const result = await db.query(`
        SELECT *
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    PARTITION BY
                        exchange,
                        symbol,
                        timeframe
                    ORDER BY open_time DESC
                ) AS rn
            FROM ${this.table}
        ) recent
        WHERE rn <= 500
        ORDER BY
            exchange,
            symbol,
            timeframe,
            open_time ASC
    `);

    return result.rows;
}

    // =====================================
    // GET BY ID
    // =====================================

    async findById(id) {

        const result = await db.query(
            `
            SELECT *
            FROM ${this.table}
            WHERE id = $1
            LIMIT 1
            `,
            [id]
        );

        return result.rows[0] ?? null;
    }


    // =====================================
    // UPDATE
    // =====================================

    async update(id, data) {

        const keys = Object.keys(data);

        if (!keys.length) {
            return null;
        }

        const values = Object.values(data);

        const sets = keys
            .map(
                (key, index) =>
                    `${key}=$${index + 1}`
            )
            .join(",");

        values.push(id);

        const query = `
            UPDATE ${this.table}
            SET
                ${sets},
                updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING *
        `;

        const result = await db.query(
            query,
            values
        );

        return result.rows[0] ?? null;
    }


    // =====================================
    // DELETE
    // =====================================

    async remove(id) {

        const result = await db.query(
            `
            DELETE FROM ${this.table}
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        return result.rows[0] ?? null;
    }


    // =====================================
    // FIND BY SYMBOL + TIMEFRAME
    // =====================================

    async findBySymbolTimeframe(
        exchange,
        symbol,
        timeframe
    ) {

        const result = await db.query(
            `
            SELECT *
            FROM ${this.table}

            WHERE exchange = $1
            AND symbol = $2
            AND timeframe = $3

            ORDER BY open_time ASC
            `,
            [
                exchange,
                symbol,
                timeframe
            ]
        );

        return result.rows;
    }


    // =====================================
    // FIND RECENT CANDLES
    // =====================================

    async findRecent(
        exchange,
        symbol,
        timeframe,
        limit = 500
    ) {

        const result = await db.query(
            `
            SELECT *
            FROM ${this.table}

            WHERE exchange = $1
            AND symbol = $2
            AND timeframe = $3

            ORDER BY open_time DESC

            LIMIT $4
            `,
            [
                exchange,
                symbol,
                timeframe,
                limit
            ]
        );

        return result.rows.reverse();
    }

}

export default new CandleRepository();