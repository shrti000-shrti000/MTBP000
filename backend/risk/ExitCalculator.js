import riskSettings from "../config/riskSettings.js";

class ExitCalculator {

    static calculate({
        entryPrice,
        side,
        atr = null
    }) {

        let stopLoss = null;
        let takeProfit = null;

        // =====================================
        // STOP LOSS
        // =====================================

        if (riskSettings.stopLoss.enabled) {

            switch (riskSettings.stopLoss.mode) {

                case "FIXED":

                    stopLoss =
                        Number(riskSettings.stopLoss.price);

                    break;

                case "PERCENT": {

                    const p =
                        Number(riskSettings.stopLoss.value);

                    if (side === "LONG") {

                        stopLoss =
                            entryPrice *
                            (1 - p / 100);

                    } else {

                        stopLoss =
                            entryPrice *
                            (1 + p / 100);

                    }

                    break;
                }

                case "ATR":

                    if (atr != null) {

                        const distance =
                            atr *
                            Number(
                                riskSettings.stopLoss.atrMultiplier
                            );

                        if (side === "LONG") {

                            stopLoss =
                                entryPrice - distance;

                        } else {

                            stopLoss =
                                entryPrice + distance;

                        }

                    }

                    break;
            }

        }

        // =====================================
        // TAKE PROFIT
        // =====================================

        if (riskSettings.takeProfit.enabled) {

            switch (riskSettings.takeProfit.mode) {

                case "FIXED":

                    takeProfit =
                        Number(riskSettings.takeProfit.price);

                    break;

                case "PERCENT": {

                    const p =
                        Number(riskSettings.takeProfit.value);

                    if (side === "LONG") {

                        takeProfit =
                            entryPrice *
                            (1 + p / 100);

                    } else {

                        takeProfit =
                            entryPrice *
                            (1 - p / 100);

                    }

                    break;
                }

                case "RR":

                    if (stopLoss != null) {

                        const risk =
                            Math.abs(
                                entryPrice - stopLoss
                            );

                        const rr =
                            Number(
                                riskSettings.takeProfit.rrRatio
                            );

                        if (side === "LONG") {

                            takeProfit =
                                entryPrice +
                                risk * rr;

                        } else {

                            takeProfit =
                                entryPrice -
                                risk * rr;

                        }

                    }

                    break;
            }

        }

        return {

            stopLoss,

            takeProfit,

            trailing:

                riskSettings.trailing

        };

    }

}

export default ExitCalculator;