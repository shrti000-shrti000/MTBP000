
import strategySettings from "../config/strategySettings.js";

export default class SignalEngine {

    static calculate(
        indicators,
        settingsOverride = null
    ) {

        /*
         * ======================================================
         * SETTINGS SOURCE
         * ======================================================
         */

        const settings =
            settingsOverride &&
            typeof settingsOverride === "object"
                ? settingsOverride
                : strategySettings;


        // ======================================================
        // RAW SCORES
        // ======================================================

        let buyScore = 0;
        let sellScore = 0;

        let buyVotes = 0;
        let sellVotes = 0;


        // ======================================================
        // RSI
        // PRIMARY DIRECTION
        // ======================================================

        let rsiScore = 0;
        let rsiValue = null;
        let rsiStrength = 0;
        let rsiDirection = "NEUTRAL";


        // ======================================================
        // EMA
        // CONFIRMATION
        // ======================================================

        let emaScore = 0;
        let emaDistance = 0;
        let emaStrength = 0;
        let emaDirection = "NEUTRAL";


        // ======================================================
        // MACD
        // CONFIRMATION
        // ======================================================

        let macdHistogram = 0;
        let macdRatio = 0;
        let macdStrength = 0;
        let macdDirection = "NEUTRAL";
        let macdScore = 0;


        // ======================================================
        // VOLUME
        // CONFIRMATION
        // ======================================================

        let volumeScore = 0;
        let volumeConfirmed = false;


        // ======================================================
        // CALIBRATION CONSTANTS
        // ======================================================

        const EMA_NEUTRAL_ZONE = 0.001;
        const EMA_FULL_STRENGTH = 0.005;

        const MACD_MIN_RATIO = 0.05;
        const MACD_FULL_RATIO = 0.50;


        // ======================================================
        // RSI
        // PRIMARY DIRECTION
        // ======================================================

        if (
            indicators.RSI !== null &&
            indicators.RSI !== undefined &&
            settings.rsi?.enabled !== false
        ) {

            const rsi =
                Number(indicators.RSI);

            rsiValue = rsi;

            const buyLevel =
                Number(settings.rsi.buyLevel);

            const sellLevel =
                Number(settings.rsi.sellLevel);

            const weight =
                Number(settings.rsi.weight);

            if (
                Number.isFinite(rsi) &&
                Number.isFinite(buyLevel) &&
                Number.isFinite(sellLevel) &&
                Number.isFinite(weight) &&
                buyLevel > 0 &&
                sellLevel < 100
            ) {

                // --------------------------------------------------
                // LONG
                // --------------------------------------------------

                if (rsi <= buyLevel) {

                    const depth =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                (buyLevel - rsi) /
                                buyLevel
                            )
                        );

                    rsiStrength =
                        0.5 +
                        (
                            0.5 *
                            depth
                        );

                    rsiStrength =
                        Math.min(
                            1,
                            Math.max(
                                0,
                                rsiStrength
                            )
                        );

                    rsiScore =
                        rsiStrength *
                        weight;

                    rsiDirection = "LONG";

                }

                // --------------------------------------------------
                // SHORT
                // --------------------------------------------------

                else if (rsi >= sellLevel) {

                    const depth =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                (rsi - sellLevel) /
                                (100 - sellLevel)
                            )
                        );

                    rsiStrength =
                        0.5 +
                        (
                            0.5 *
                            depth
                        );

                    rsiStrength =
                        Math.min(
                            1,
                            Math.max(
                                0,
                                rsiStrength
                            )
                        );

                    rsiScore =
                        -(
                            rsiStrength *
                            weight
                        );

                    rsiDirection = "SHORT";

                }

                // --------------------------------------------------
                // NEUTRAL
                // --------------------------------------------------

                else {

                    rsiStrength = 0;
                    rsiScore = 0;
                    rsiDirection = "NEUTRAL";

                }

            }

        }


        // ======================================================
        // EMA
        // CONFIRMATION
        // ======================================================

        if (
            indicators.EMA_FAST &&
            indicators.EMA_SLOW &&
            settings.ema?.enabled !== false
        ) {

            const fast =
                Number(
                    indicators.EMA_FAST.value
                );

            const slow =
                Number(
                    indicators.EMA_SLOW.value
                );

            const weight =
                Number(
                    settings.ema.weight
                );

            if (
                Number.isFinite(fast) &&
                Number.isFinite(slow) &&
                Number.isFinite(weight) &&
                slow !== 0
            ) {

                emaDistance =
                    Math.abs(
                        (fast - slow) /
                        slow
                    );

                if (
                    emaDistance <=
                    EMA_NEUTRAL_ZONE
                ) {

                    emaStrength = 0;
                    emaScore = 0;
                    emaDirection = "NEUTRAL";

                }

                else {

                    emaStrength =
                        Math.min(
                            1,
                            (
                                emaDistance -
                                EMA_NEUTRAL_ZONE
                            ) /
                            (
                                EMA_FULL_STRENGTH -
                                EMA_NEUTRAL_ZONE
                            )
                        );

                    emaStrength =
                        Math.max(
                            0,
                            emaStrength
                        );

                    emaScore =
                        emaStrength *
                        weight;

                    if (fast > slow) {

                        emaDirection = "LONG";

                    }

                    else if (fast < slow) {

                        emaDirection = "SHORT";

                    }

                }

            }

        }


        // ======================================================
        // MACD
        // CONFIRMATION
        // ======================================================

        const atrValue =
            Number(
                indicators.ATR
            );

        if (
            indicators.MACD &&
            indicators.MACD.histogram !== undefined &&
            settings.macd?.enabled !== false
        ) {

            macdHistogram =
                Number(
                    indicators.MACD.histogram
                );

            const weight =
                Number(
                    settings.macd.weight
                );

            if (
                Number.isFinite(macdHistogram) &&
                Number.isFinite(weight) &&
                Number.isFinite(atrValue) &&
                atrValue > 0
            ) {

                macdRatio =
                    Math.abs(
                        macdHistogram
                    ) /
                    atrValue;

                if (
                    macdRatio <=
                    MACD_MIN_RATIO
                ) {

                    macdStrength = 0;
                    macdScore = 0;
                    macdDirection = "NEUTRAL";

                }

                else {

                    macdStrength =
                        Math.min(
                            1,
                            (
                                macdRatio -
                                MACD_MIN_RATIO
                            ) /
                            (
                                MACD_FULL_RATIO -
                                MACD_MIN_RATIO
                            )
                        );

                    macdStrength =
                        Math.max(
                            0,
                            macdStrength
                        );

                    macdScore =
                        macdStrength *
                        weight;

                    if (
                        macdHistogram > 0
                    ) {

                        macdDirection = "LONG";

                    }

                    else if (
                        macdHistogram < 0
                    ) {

                        macdDirection = "SHORT";

                    }

                }

            }

        }


        // ======================================================
        // DETERMINE PRIMARY DIRECTION
        // ======================================================

        let primaryDirection = "NEUTRAL";

        if (
            rsiDirection === "LONG" ||
            rsiDirection === "SHORT"
        ) {

            primaryDirection =
                rsiDirection;

        }

        else {

            if (
                emaDirection === "LONG" &&
                macdDirection === "LONG"
            ) {

                primaryDirection = "LONG";

            }

            else if (
                emaDirection === "SHORT" &&
                macdDirection === "SHORT"
            ) {

                primaryDirection = "SHORT";

            }

            else if (
                emaDirection === "LONG" &&
                macdDirection === "NEUTRAL"
            ) {

                primaryDirection = "LONG";

            }

            else if (
                emaDirection === "SHORT" &&
                macdDirection === "NEUTRAL"
            ) {

                primaryDirection = "SHORT";

            }

            else if (
                macdDirection === "LONG" &&
                emaDirection === "NEUTRAL"
            ) {

                primaryDirection = "LONG";

            }

            else if (
                macdDirection === "SHORT" &&
                emaDirection === "NEUTRAL"
            ) {

                primaryDirection = "SHORT";

            }

        }


        // ======================================================
        // DIRECTIONAL SCORE
        // ======================================================

        let directionalScore = 0;

        let directionalWeight = 0;


        // ======================================================
        // RSI CONTRIBUTION
        // ======================================================

        const rsiAvailable =
            settings.rsi?.enabled !== false &&
            indicators.RSI !== null &&
            indicators.RSI !== undefined &&
            (
                rsiDirection === "LONG" ||
                rsiDirection === "SHORT"
            );

        if (
            rsiAvailable
        ) {

            const weight =
                Number(
                    settings.rsi.weight || 0
                );

            directionalWeight +=
                weight;

            directionalScore +=
                rsiStrength *
                weight;

        }


        // ======================================================
        // EMA CONTRIBUTION
        // ======================================================

        const emaAvailable =
            settings.ema?.enabled !== false &&
            indicators.EMA_FAST &&
            indicators.EMA_SLOW &&
            (
                emaDirection === "LONG" ||
                emaDirection === "SHORT"
            );

        if (
            emaAvailable
        ) {

            const weight =
                Number(
                    settings.ema.weight || 0
                );

            directionalWeight +=
                weight;

            if (
                primaryDirection ===
                emaDirection
            ) {

                directionalScore +=
                    emaStrength *
                    weight;

            }

            else {

                directionalScore -=
                    emaStrength *
                    weight;

            }

        }


        // ======================================================
        // MACD CONTRIBUTION
        // ======================================================

        const macdAvailable =
            settings.macd?.enabled !== false &&
            indicators.MACD &&
            indicators.MACD.histogram !== undefined &&
            Number.isFinite(atrValue) &&
            atrValue > 0 &&
            (
                macdDirection === "LONG" ||
                macdDirection === "SHORT"
            );

        if (
            macdAvailable
        ) {

            const weight =
                Number(
                    settings.macd.weight || 0
                );

            directionalWeight +=
                weight;

            if (
                primaryDirection ===
                macdDirection
            ) {

                directionalScore +=
                    macdStrength *
                    weight;

            }

            else {

                directionalScore -=
                    macdStrength *
                    weight;

            }

        }


        // ======================================================
        // VOLUME
        // CONFIRMATION
        // ======================================================

        if (
            indicators.Volume &&
            settings.volume?.enabled !== false
        ) {

            const relative =
                Number(
                    indicators.Volume.relative
                );

            const multiplier =
                Number(
                    settings.volume.multiplier
                );

            const weight =
                Number(
                    settings.volume.weight
                );

            if (
                Number.isFinite(relative) &&
                Number.isFinite(multiplier) &&
                Number.isFinite(weight) &&
                multiplier > 0
            ) {

                if (
                    relative >= multiplier
                ) {

                    const strength =
                        Math.min(
                            1,
                            relative / multiplier
                        );

                    volumeScore =
                        strength *
                        weight;

                    volumeConfirmed = true;

                    if (
                        primaryDirection ===
                        "LONG" ||
                        primaryDirection ===
                        "SHORT"
                    ) {

                        directionalWeight +=
                            weight;

                        directionalScore +=
                            volumeScore;

                    }

                }

            }

        }


        // ======================================================
        // SCORE CLAMP
        // ======================================================

        directionalScore =
            Math.max(
                0,
                directionalScore
            );


        // ======================================================
        // BUILD BUY / SELL SCORE
        // ======================================================

        if (
            primaryDirection === "LONG"
        ) {

            buyScore =
                directionalScore;

            buyVotes =
                1;

            if (
                emaDirection === "LONG"
            ) {

                buyVotes++;

            }

            if (
                macdDirection === "LONG"
            ) {

                buyVotes++;

            }

        }

        else if (
            primaryDirection === "SHORT"
        ) {

            sellScore =
                directionalScore;

            sellVotes =
                1;

            if (
                emaDirection === "SHORT"
            ) {

                sellVotes++;

            }

            if (
                macdDirection === "SHORT"
            ) {

                sellVotes++;

            }

        }


        // ======================================================
        // ACTIVE WEIGHT
        // ======================================================

        let activeWeight = 0;

        if (
            settings.rsi?.enabled !== false &&
            indicators.RSI !== null &&
            indicators.RSI !== undefined
        ) {

            const weight =
                Number(
                    settings.rsi.weight || 0
                );

            if (
                Number.isFinite(weight) &&
                weight > 0
            ) {

                activeWeight +=
                    weight;

            }

        }

        if (
            settings.ema?.enabled !== false &&
            indicators.EMA_FAST &&
            indicators.EMA_SLOW
        ) {

            const weight =
                Number(
                    settings.ema.weight || 0
                );

            if (
                Number.isFinite(weight) &&
                weight > 0
            ) {

                activeWeight +=
                    weight;

            }

        }

        if (
            settings.macd?.enabled !== false &&
            indicators.MACD &&
            indicators.MACD.histogram !== undefined &&
            Number.isFinite(atrValue) &&
            atrValue > 0
        ) {

            const weight =
                Number(
                    settings.macd.weight || 0
                );

            if (
                Number.isFinite(weight) &&
                weight > 0
            ) {

                activeWeight +=
                    weight;

            }

        }

        if (
            settings.volume?.enabled !== false &&
            indicators.Volume
        ) {

            const weight =
                Number(
                    settings.volume.weight || 0
                );

            if (
                Number.isFinite(weight) &&
                weight > 0
            ) {

                activeWeight +=
                    weight;

            }

        }


        // ======================================================
        // TOTAL WEIGHT
        // ======================================================

        /*
         * Compatibility:
         *
         * totalWeight در خروجی حفظ شده است.
         *
         * مقدار آن همان امتیاز نهایی جهت‌دار است
         * تا ساختار فعلی مصرف‌کننده‌ها تغییر نکند.
         */

        const totalWeight =
            directionalScore;


        // ======================================================
        // CONFIDENCE
        // ======================================================

        /*
         * IMPORTANT:
         *
         * قبلاً Confidence با directionalWeight محاسبه
         * می‌شد.
         *
         * مشکل:
         *
         * اگر فقط EMA جهت‌دار بود:
         *
         *     score = 30
         *     directionalWeight = 30
         *     confidence = 100
         *
         * این باعث Confidence مصنوعی می‌شد.
         *
         * اکنون Confidence نسبت به کل وزن فعال
         * و معتبر محاسبه می‌شود.
         *
         * بنابراین یک اندیکاتور به‌تنهایی نمی‌تواند
         * صرفاً به دلیل اینکه تنها اندیکاتور جهت‌دار است
         * Confidence = 100 تولید کند.
         */

        const confidence =
            activeWeight > 0
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        Math.round(
                            (
                                directionalScore /
                                activeWeight
                            ) * 100
                        )
                    )
                )
                : 0;


        // ======================================================
        // SIGNAL SCORE
        // ======================================================

        /*
         * SignalScore نیز باید از همان نرمال‌سازی
         * استفاده کند.
         *
         * این باعث می‌شود:
         *
         * EMA تنها
         * یا RSI تنها
         *
         * نتواند به‌تنهایی threshold ورود را
         * به شکل مصنوعی عبور دهد.
         */

        const signalScore =
            activeWeight > 0
                ? (
                    directionalScore /
                    activeWeight
                ) * 100
                : 0;


        // ======================================================
        // CONFLICT ANALYSIS
        // ======================================================

        let scoreDirection =
            primaryDirection;

        let conflictWithRSI = false;
        let rsiOpposesScoreDirection = false;

        const opposingConfirmation = (
            rsiDirection !== "NEUTRAL" &&
            (
                (
                    emaDirection !== "NEUTRAL" &&
                    emaDirection !== rsiDirection
                ) ||
                (
                    macdDirection !== "NEUTRAL" &&
                    macdDirection !== rsiDirection
                )
            )
        );

        if (
            opposingConfirmation
        ) {

            conflictWithRSI = true;
            rsiOpposesScoreDirection = false;

        }


        const rsiOppositionScore =
            0;

        const rsiOppositionPercent =
            0;


        // ======================================================
        // SIGNAL THRESHOLD
        // ======================================================

        const mode =
            settings.signalMode;

        let signalLimit = 40;

        if (
            mode === "conservative"
        ) {

            signalLimit = 60;

        }

        else if (
            mode === "balanced"
        ) {

            signalLimit = 40;

        }

        else if (
            mode === "aggressive"
        ) {

            signalLimit = 20;

        }


        // ======================================================
        // FINAL SIGNAL
        // ======================================================

        let signal = "NEUTRAL";
        let action = null;


        if (
            primaryDirection === "LONG" &&
            signalScore >= signalLimit
        ) {

            signal = "LONG";
            action = "OPEN";

        }

        else if (
            primaryDirection === "SHORT" &&
            signalScore >= signalLimit
        ) {

            signal = "SHORT";
            action = "OPEN";

        }


        // ======================================================
        // RESULT
        // ======================================================

        return {

            buyScore,
            sellScore,

            buyVotes,
            sellVotes,

            totalWeight,

            signal,
            action,

            confidence,

            activeWeight,

            directionalWeight,

            signalScore,

            volumeConfirmed,

            details: {

                rsi: {

                    value:
                        rsiValue,

                    score:
                        Math.abs(
                            rsiScore
                        ),

                    strength:
                        rsiStrength,

                    direction:
                        rsiDirection

                },

                ema: {

                    score:
                        Math.abs(
                            emaScore
                        ),

                    distance:
                        emaDistance,

                    strength:
                        emaStrength,

                    direction:
                        emaDirection

                },

                macd: {

                    score:
                        Math.abs(
                            macdScore
                        ),

                    histogram:
                        macdHistogram,

                    atr:
                        atrValue,

                    ratio:
                        macdRatio,

                    strength:
                        macdStrength,

                    direction:
                        macdDirection

                },

                volume: {

                    score:
                        Math.abs(
                            volumeScore
                        )

                },

                primaryDirection,

                conflictWithRSI,

                rsiOpposesScoreDirection,

                rsiOppositionScore,

                rsiOppositionPercent

            }

        };

    }

}
