class RiskStore {
    constructor() {
        this.openPositions = [];

        this.dailyLoss = 0;

        this.currentDrawdown = 0;

        this.consecutiveLosses = 0;

        this.cooldownUntil = null;

        

        // =========================
        // SESSION
        // =========================

        this.sessionStart = new Date();
    }

    getOpenPositions() {
        return this.openPositions;
    }

    addPosition(position) {
        this.openPositions.push(position);
    }

    removePosition(positionId) {
        this.openPositions =
            this.openPositions.filter(
                (p) => p.id !== positionId
            );
    }

    setDailyLoss(value) {
        this.dailyLoss = value;
    }

    getDailyLoss() {
        return this.dailyLoss;
    }

    setDrawdown(value) {
        this.currentDrawdown = value;
    }

    getDrawdown() {
        return this.currentDrawdown;
    }

    setConsecutiveLosses(value) {
        this.consecutiveLosses = value;
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

    // =========================
    // SESSION
    // =========================

    getSessionStart() {
        return this.sessionStart;
    }

    setSessionStart(date) {
        this.sessionStart = date;
    }
}

export default new RiskStore();