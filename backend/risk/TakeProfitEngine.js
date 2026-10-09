class TakeProfitEngine {

    static calculate({

        side,

        entryPrice,

        stopLossPrice,

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

                const risk =
                    Math.abs(
                        entryPrice - stopLossPrice
                    );

                const rr =
                    Number(settings.rrRatio ?? settings.value ?? 2);

                if (side === "LONG") {

                    return Number(

                        (
                            entryPrice + risk * rr
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
            // (فعلاً پیاده‌سازی نشده)
            // =====================================

            case "ATR": {

    const atr =
        settings.atr;

    if (
        atr == null ||
        !Number.isFinite(Number(atr))
    ) {

        return null;

    }

    const multiplier =
        Number(
            settings.atrMultiplier ?? 2
        );

    const distance =
        Number(atr) * multiplier;

    if (side === "LONG") {

        return Number(
            (
                entryPrice + distance
            ).toFixed(6)
        );

    }

    return Number(
        (
            entryPrice - distance
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