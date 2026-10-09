import riskSettings from "../config/riskSettings.js";

class RiskStore {
    constructor() {
        this.openPositions = [];

        this.dailyLoss = 0;
        this.currentDrawdown = 0;
        this.consecutiveLosses = 0;
        this.cooldownUntil = null;

        this.sessionStart = new Date();

        // Daily protection baseline/state (values are percentages).
        this.dailyDate = this.getDateKey(new Date());
        this.dailyStartEquity = null;
        this.dailyRealizedPnL = 0;

        // Peak equity used to calculate percentage drawdown.
        this.peakEquity = null;
    }

    getDateKey(date) {
        const value = date instanceof Date ? date : new Date(date);
        if (!Number.isFinite(value.getTime())) return null;

        return [
            value.getFullYear(),
            String(value.getMonth() + 1).padStart(2, "0"),
            String(value.getDate()).padStart(2, "0")
        ].join("-");
    }

    getOpenPositions() {
        return this.openPositions;
    }

    addPosition(position) {
        this.openPositions.push(position);
    }

    removePosition(positionId) {
        this.openPositions = this.openPositions.filter(
            (p) => p.id !== positionId
        );
    }

    setDailyLoss(value) {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) {
            this.dailyLoss = number;
        }
    }

    getDailyLoss() {
        return this.dailyLoss;
    }

    setDrawdown(value) {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) {
            this.currentDrawdown = number;
        }
    }

    getDrawdown() {
        return this.currentDrawdown;
    }

    setConsecutiveLosses(value) {
        const number = Number(value);
        if (Number.isFinite(number) && number >= 0) {
            this.consecutiveLosses = Math.floor(number);
        }
    }

    getConsecutiveLosses() {
        return this.consecutiveLosses;
    }

    setCooldown(date) {
        this.cooldownUntil = date;
    }

    getCooldown() {
        return this.cooldownUntil;
    }

    getSessionStart() {
        return this.sessionStart;
    }

    setSessionStart(date) {
        const value = new Date(date);
        if (Number.isFinite(value.getTime())) {
            this.sessionStart = value;
        }
    }

    /**
     * Record one successfully closed trade.
     * pnl must be the realized PnL for that trade; equityBefore/equityAfter
     * must be account equity/balance values in the same currency.
     */
    recordClosedTrade(pnl, equityBefore, equityAfter) {
        const realizedPnL = Number(pnl);
        const before = Number(equityBefore);
        const after = Number(equityAfter);

        if (
            !Number.isFinite(realizedPnL) ||
            !Number.isFinite(before) ||
            !Number.isFinite(after) ||
            before <= 0 ||
            after < 0
        ) {
            return false;
        }

        const now = new Date();
        const today = this.getDateKey(now);

        // Reset daily counters on local calendar-day change.
        if (this.dailyDate !== today) {
            this.dailyDate = today;
            this.dailyStartEquity = before;
            this.dailyRealizedPnL = 0;
            this.dailyLoss = 0;
        }

        if (!(this.dailyStartEquity > 0)) {
            this.dailyStartEquity = before;
        }

        this.dailyRealizedPnL += realizedPnL;
        this.dailyLoss = Math.max(
            0,
            (-this.dailyRealizedPnL / this.dailyStartEquity) * 100
        );

        // Consecutive losses and cooldown are updated only after a close.
        if (realizedPnL < 0) {
            this.consecutiveLosses += 1;

            if (riskSettings.protection?.pauseAfterLoss) {
                const cooldownMinutes = Number(
                    riskSettings.protection?.cooldownMinutes ?? 0
                );

                if (Number.isFinite(cooldownMinutes) && cooldownMinutes > 0) {
                    this.cooldownUntil = new Date(
                        now.getTime() + cooldownMinutes * 60 * 1000
                    );
                }
            }
        } else if (realizedPnL > 0) {
            this.consecutiveLosses = 0;
        }

        // Use post-close equity to track peak-to-current drawdown.
        this.peakEquity = Math.max(
            this.peakEquity ?? before,
            before,
            after
        );

        this.currentDrawdown = this.peakEquity > 0
            ? Math.max(0, ((this.peakEquity - after) / this.peakEquity) * 100)
            : 0;

        return true;
    }
}

export default new RiskStore();
