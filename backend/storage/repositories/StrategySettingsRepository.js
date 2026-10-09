import db from "../database/Database.js";

class StrategySettingsRepository {

    constructor() {
        this.table = "strategy_settings";
    }


    // =====================================
    // UPSERT STRATEGY SETTINGS
    // =====================================

    async upsert(settings) {

        const query = `
            INSERT INTO ${this.table}
            (
                exchange,
                symbol,
                timeframe,
                signal_mode,

                rsi_enabled,
                rsi_period,
                rsi_buy_level,
                rsi_sell_level,
                rsi_weight,

                ema_enabled,
                ema_fast,
                ema_slow,
                ema_weight,

                macd_enabled,
                macd_fast,
                macd_slow,
                macd_signal,
                macd_weight,

                volume_enabled,
                volume_period,
                volume_multiplier,
                volume_threshold,
                volume_weight,

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

                $10,
                $11,
                $12,
                $13,

                $14,
                $15,
                $16,
                $17,
                $18,

                $19,
                $20,
                $21,
                $22,
                $23,

                NOW()
            )

            ON CONFLICT
            (
                exchange,
                symbol,
                timeframe
            )

            DO UPDATE SET

                signal_mode = EXCLUDED.signal_mode,

                rsi_enabled = EXCLUDED.rsi_enabled,
                rsi_period = EXCLUDED.rsi_period,
                rsi_buy_level = EXCLUDED.rsi_buy_level,
                rsi_sell_level = EXCLUDED.rsi_sell_level,
                rsi_weight = EXCLUDED.rsi_weight,

                ema_enabled = EXCLUDED.ema_enabled,
                ema_fast = EXCLUDED.ema_fast,
                ema_slow = EXCLUDED.ema_slow,
                ema_weight = EXCLUDED.ema_weight,

                macd_enabled = EXCLUDED.macd_enabled,
                macd_fast = EXCLUDED.macd_fast,
                macd_slow = EXCLUDED.macd_slow,
                macd_signal = EXCLUDED.macd_signal,
                macd_weight = EXCLUDED.macd_weight,

                volume_enabled = EXCLUDED.volume_enabled,
                volume_period = EXCLUDED.volume_period,
                volume_multiplier = EXCLUDED.volume_multiplier,
                volume_threshold = EXCLUDED.volume_threshold,
                volume_weight = EXCLUDED.volume_weight,

                updated_at = NOW()

            RETURNING *
        `;


        const result = await db.query(
            query,
            [

                settings.exchange,
                settings.symbol,
                settings.timeframe,
                settings.signalMode,

                // RSI
                settings.rsi?.enabled,
                settings.rsi?.period,
                settings.rsi?.buyLevel,
                settings.rsi?.sellLevel,
                settings.rsi?.weight,

                // EMA
                settings.ema?.enabled,
                settings.ema?.fast,
                settings.ema?.slow,
                settings.ema?.weight,

                // MACD
                settings.macd?.enabled,
                settings.macd?.fast,
                settings.macd?.slow,
                settings.macd?.signal,
                settings.macd?.weight,

                // VOLUME
                settings.volume?.enabled,
                settings.volume?.period,
                settings.volume?.multiplier,
                settings.volume?.threshold,
                settings.volume?.weight
            ]
        );


        return this.fromDatabaseRow(
            result.rows[0]
        );
    }


    // =====================================
    // FIND ONE
    // =====================================

    async findOne(
        exchange,
        symbol,
        timeframe
    ) {

        const query = `
            SELECT *
            FROM ${this.table}

            WHERE exchange = $1
            AND symbol = $2
            AND timeframe = $3

            LIMIT 1
        `;


        const result = await db.query(
            query,
            [
                exchange,
                symbol,
                timeframe
            ]
        );


        if (!result.rows.length) {
            return null;
        }


        return this.fromDatabaseRow(
            result.rows[0]
        );
    }


    // =====================================
    // FIND ALL
    // =====================================

    async findAll() {

        const result = await db.query(
            `
            SELECT *
            FROM ${this.table}

            ORDER BY updated_at DESC
            `
        );


        return result.rows.map(
            (row) =>
                this.fromDatabaseRow(row)
        );
    }


    // =====================================
    // DELETE ONE
    // =====================================

    async remove(
        exchange,
        symbol,
        timeframe
    ) {

        const result = await db.query(
            `
            DELETE FROM ${this.table}

            WHERE exchange = $1
            AND symbol = $2
            AND timeframe = $3

            RETURNING *
            `,
            [
                exchange,
                symbol,
                timeframe
            ]
        );


        if (!result.rows.length) {
            return null;
        }


        return this.fromDatabaseRow(
            result.rows[0]
        );
    }


    // =====================================
    // DATABASE ROW → JS SETTINGS
    // =====================================

    fromDatabaseRow(row) {

        if (!row) {
            return null;
        }


        return {

            exchange:
                row.exchange,

            symbol:
                row.symbol,

            timeframe:
                row.timeframe,

            signalMode:
                row.signal_mode,


            // =================================
            // RSI
            // =================================

            rsi: {

                enabled:
                    row.rsi_enabled,

                period:
                    Number(row.rsi_period),

                buyLevel:
                    Number(row.rsi_buy_level),

                sellLevel:
                    Number(row.rsi_sell_level),

                weight:
                    Number(row.rsi_weight)
            },


            // =================================
            // EMA
            // =================================

            ema: {

                enabled:
                    row.ema_enabled,

                fast:
                    Number(row.ema_fast),

                slow:
                    Number(row.ema_slow),

                weight:
                    Number(row.ema_weight)
            },


            // =================================
            // MACD
            // =================================

            macd: {

                enabled:
                    row.macd_enabled,

                fast:
                    Number(row.macd_fast),

                slow:
                    Number(row.macd_slow),

                signal:
                    Number(row.macd_signal),

                weight:
                    Number(row.macd_weight)
            },


            // =================================
            // VOLUME
            // =================================

            volume: {

                enabled:
                    row.volume_enabled,

                period:
                    Number(row.volume_period),

                multiplier:
                    Number(row.volume_multiplier),

                threshold:
                    Number(row.volume_threshold),

                weight:
                    Number(row.volume_weight)
            },


            // =================================
            // TIMESTAMPS
            // =================================

            createdAt:
                row.created_at,

            updatedAt:
                row.updated_at
        };
    }
}


export default new StrategySettingsRepository();