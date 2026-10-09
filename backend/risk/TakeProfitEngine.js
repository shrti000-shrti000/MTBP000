class TakeProfitEngine {

    static calculate({

        side,

        entryPrice,

        stopLossPrice,

        atr = null,

        settings,

    }) {

        if (!settings || !settings.enabled) {

            return null;

        }

        const mode =
            String(settings.mode || "").toUpperCase();

        switch (mode) {

            // =====================================
            // PRICE
            // =====================================

            case "PRICE":

                return Number(settings.price);


            // =====================================
            // PERCENT
            // =====================================

            case "PERCENT": {

                const percent =
                    Number(settings.value);

                if (side === "LONG") {

                    return Number(

                        (
                            entryPrice *
                            (1 + percent / 100)
                        ).toFixed(6)

                    );

                }

                return Number(

                    (
                        entryPrice *
                        (1 - percent / 100)
                    ).toFixed(6)

                );

            }


            // =====================================
            // RISK REWARD
            // =====================================

            case "RR":
            case "RISK_REWARD":
                
            
            {

                if (
                    stopLossPrice == null
                ) {

                    return null;

                }

                const numericEntryPrice = Number(entryPrice);
                const numericStopLossPrice = Number(stopLossPrice);

                if (
                    !Number.isFinite(numericEntryPrice) ||
                    !Number.isFinite(numericStopLossPrice) ||
                    numericEntryPrice <= 0 ||
                    numericStopLossPrice <= 0
                ) {
                    return null;
                }

                const risk =
                    Math.abs(
                        numericEntryPrice - numericStopLossPrice
                    );

                const rr =
                    Number(settings.rrRatio ?? settings.value ?? 2);

                if (
                    !Number.isFinite(rr) ||
                    rr <= 0 ||
                    risk <= 0
                ) {
                    return null;
                }

                if (side === "LONG") {

                    return Number(

                        (
                            numericEntryPrice + risk * rr
                        ).toFixed(6)

                    );

                }

                return Number(

                    (
                        entryPrice - risk * rr
                    ).toFixed(6)

                );

            }


            // =====================================
            // ATR
            // Uses the ATR supplied by RiskManager, with settings.atr as fallback.
            // =====================================

            case "ATR": {

    const numericAtr =
        atr ?? settings.atr;

    const numericEntryPrice =
        Number(entryPrice);

    if (
        !Number.isFinite(numericEntryPrice) ||
        numericEntryPrice <= 0
    ) {
        return null;
    }

    const atrValue =
        Number(numericAtr);

    if (
        numericAtr == null ||
        !Number.isFinite(atrValue) ||
        atrValue <= 0
    ) {

        return null;

    }

    const multiplier =
        Number(
            settings.atrMultiplier ?? 2
        );

    if (
        !Number.isFinite(multiplier) ||
        multiplier <= 0
    ) {
        return null;
    }

    const distance =
        atrValue * multiplier;

    if (side === "LONG") {

        return Number(
            (
                numericEntryPrice + distance
            ).toFixed(6)
        );

    }

    return Number(
        (
            numericEntryPrice - distance
        ).toFixed(6)
    );

}


            // =====================================
            // TRAILING
            // بعداً به TrailingStopEngine وصل می‌شود
            // =====================================

            case "TRAILING":

                return null;


            default:

                return null;

        }

    }

}

export default TakeProfitEngine;