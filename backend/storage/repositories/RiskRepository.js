import PostgresAdapter from "../database/PostgresAdapter.js";

class RiskRepository {

    constructor() {

        this.table = "risk_state";

    }


    // =====================================
    // LOAD RISK STATE
    // =====================================

    async load() {

        const rows =
            await PostgresAdapter.findAll(
                this.table
            );

        return rows[0] ?? null;

    }


    // =====================================
    // SAVE / UPSERT RISK STATE
    // =====================================

    async save(state) {

        const existing =
            await this.load();


        if (!existing) {

            return await PostgresAdapter.insert(
                this.table,
                {
                    id: 1,

                    daily_loss:
                        state.dailyLoss ?? 0,

                    current_drawdown:
                        state.currentDrawdown ?? 0,

                    consecutive_losses:
                        state.consecutiveLosses ?? 0,

                    cooldown_until:
                        state.cooldownUntil ?? null,

                    session_start:
                        state.sessionStart ?? new Date(),

                }
            );

        }


        return await PostgresAdapter.update(
            this.table,
            1,
            {

                daily_loss:
                    state.dailyLoss ?? 0,

                current_drawdown:
                    state.currentDrawdown ?? 0,

                consecutive_losses:
                    state.consecutiveLosses ?? 0,

                cooldown_until:
                    state.cooldownUntil ?? null,

                session_start:
                    state.sessionStart ??
                    existing.session_start,

            }
        );

    }


    // =====================================
    // RESET
    // =====================================

    async reset() {

        return await PostgresAdapter.update(
            this.table,
            1,
            {

                daily_loss: 0,

                current_drawdown: 0,

                consecutive_losses: 0,

                cooldown_until: null,

                session_start: new Date(),

            }
        );

    }

}

export default new RiskRepository();