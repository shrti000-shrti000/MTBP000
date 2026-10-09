import strategySettings from "../config/strategySettings.js";
import riskSettings from "../config/riskSettings.js";
import SignalEngine from "../strategy/SignalEngine.js";
import { CandleHistory } from "../candles/candleHistory.js";

/**
 * ============================================================
 * MTBP - Calibration Engine
 * ============================================================
 *
 * Historical Strategy Calibration
 *
 * IMPORTANT:
 * - Signal is generated on candle N.
 * - Entry happens on candle N+1 OPEN.
 * - Chandelier calculations use previous candles only.
 * - Current candle is not included in chandelier lookback.
 * - Entry and exit fees are included.
 * - Calibration does not place real orders.
 *
 * Production alignment:
 * - Position sizing follows PositionSizer.js logic.
 * - Balance used for sizing is CURRENT simulation balance.
 * - positionSizePercent / riskPerTrade / maxPositionSize /
 *   minimumOrderSize / leverage are respected.
 *
 * TAKE PROFIT MODES:
 *
 * FIXED_RR
 *   Fixed TP based on initial SL distance.
 *
 * TRAILING
 *   No fixed TP.
 *   Trailing stop becomes the dynamic exit mechanism.
 *
 * TRAILING MODES:
 *
 * CHANDELIER
 *   Highest/lowest previous lookback
 *   +/- previous trailing ATR * multiplier.
 *
 * VOLATILITY
 *   Previous close
 *   +/- previous trailing ATR * multiplier.
 *
 * C3 SUPPORT:
 * - strategySettingsOverride can be supplied through run().
 * - When no override is supplied, production strategySettings
 *   remain unchanged and are used exactly as before.
 * ============================================================
 */

export default class CalibrationEngine {

    // ========================================================
    // SUPPORTED TIMEFRAMES
    // ========================================================

    static SUPPORTED_TIMEFRAMES = [
        "5m",
        "15m",
        "30m",
        "1h"
    ];


    // ========================================================
    // DEFAULT CONFIGURATION
    // ========================================================

    static DEFAULTS = {

        exchange: "TOOBIT",

        symbol: strategySettings.symbol || "BTCUSDT",

        timeframe: strategySettings.timeframe || "15m",

        candleLimit: 470,

        initialBalance: 10000,

        leverage: Number(riskSettings.leverage ?? 1),

        feeRate: 0.0006,

        slippageRate: 0,

        // STOP LOSS — active production settings

        stopLoss: {

            enabled: riskSettings.stopLoss?.enabled !== false,

            atrPeriod: Number(riskSettings.stopLoss?.atrPeriod ?? 10),

            atrMultiplier: Number(riskSettings.stopLoss?.atrMultiplier ?? 1.7)

        },

        // TAKE PROFIT — map production mode to calibration engine mode

        takeProfit: {

            enabled: riskSettings.takeProfit?.enabled !== false,

            mode:
                String(riskSettings.takeProfit?.mode ?? "RISK_REWARD").toUpperCase() === "RISK_REWARD"
                    ? "FIXED_RR"
                    : String(riskSettings.takeProfit?.mode ?? "FIXED_RR").toUpperCase(),

            rrRatio: Number(riskSettings.takeProfit?.rrRatio ?? 1.5)

        },

        // TRAILING — active production settings

        trailing: {

            enabled: riskSettings.trailing?.enabled !== false,

            mode: String(riskSettings.trailing?.mode ?? "CHANDELIER").toUpperCase(),

            activationPercent: Number(riskSettings.trailing?.activationPercent ?? 0),

            atrPeriod: Number(riskSettings.trailing?.atrPeriod ?? 30),

            atrMultiplier: Number(riskSettings.trailing?.atrMultiplier ?? 0.5),

            chandelierLookback: Number(riskSettings.trailing?.chandelierLookback ?? 60),

            volatilitySource: riskSettings.trailing?.volatilitySource ?? "CLOSE"

        },

        // POSITION SIZING — active production settings

        positionSizing: {

            positionMode: String(riskSettings.positionMode ?? "AUTO"),

            positionSizePercent: Number(riskSettings.positionSizePercent ?? 10),

            fixedLot: Number(riskSettings.fixedLot ?? 0.01),

            maxPositionSize: Number(riskSettings.maxPositionSize ?? 100),

            minimumOrderSize: Number(riskSettings.minimumOrderSize ?? 10),

            useBalancePercent: riskSettings.useBalancePercent !== false,

            maxLossPerTrade: Number(riskSettings.maxLossPerTrade ?? 2),

            riskPerTrade: Number(riskSettings.riskPerTrade ?? 1),

            minBalanceToTrade: Number(riskSettings.minBalanceToTrade ?? 5),

            leverage: Number(riskSettings.leverage ?? 1)

        },

        // 0 = disabled

        maxBarsInTrade: 0

    };


    // ========================================================
    // MAIN RUN
    // ========================================================

    static async run(options = {}) {

        const config =
            this.normalizeConfig(options);


        /*
         * C3 PARAMETER OVERRIDE
         *
         * If no override is supplied, the normal
         * strategySettings object is used.
         *
         * This does NOT modify the real strategy settings.
         */

        config.strategySettingsOverride =
            options.strategySettingsOverride &&
            typeof options.strategySettingsOverride === "object"
                ? options.strategySettingsOverride
                : null;


        if (
            !this.SUPPORTED_TIMEFRAMES.includes(
                config.timeframe
            )
        ) {

            throw new Error(
                `Unsupported calibration timeframe: ${config.timeframe}`
            );

        }


        let candles =
            Array.isArray(options.candles)
                ? options.candles
                : null;


        if (!candles) {

            candles =
                await this.loadHistoricalCandles(
                    config
                );

        }


        if (
            !Array.isArray(candles) ||
            candles.length < 100
        ) {

            throw new Error(
                `Not enough historical candles for calibration. Received: ${
                    Array.isArray(candles)
                        ? candles.length
                        : 0
                }`
            );

        }


        candles =
            this.normalizeCandles(
                candles
            );


        if (
            candles.length < 100
        ) {

            throw new Error(
                `Not enough valid candles after normalization. Received: ${candles.length}`
            );

        }


        const indicatorData =
            this.buildIndicators(
                candles,
                config
            );


        const simulation =
            this.simulate(
                candles,
                indicatorData,
                config
            );


        const metrics =
            this.calculateMetrics(
                simulation,
                config
            );


        return {

            success: true,

            config: {

                exchange:
                    config.exchange,

                symbol:
                    config.symbol,

                timeframe:
                    config.timeframe,

                candleCount:
                    candles.length,

                initialBalance:
                    config.initialBalance,

                feeRate:
                    config.feeRate,

                slippageRate:
                    config.slippageRate,

                stopLoss:
                    {
                        ...config.stopLoss
                    },

                takeProfit:
                    {
                        ...config.takeProfit
                    },

                trailing:
                    {
                        ...config.trailing
                    },

                positionSizing:
                    {
                        ...config.positionSizing
                    },

                strategySettingsOverride:
                    config.strategySettingsOverride
                        ? {
                            ...config.strategySettingsOverride
                        }
                        : null

            },

            metrics,

            trades:
                simulation.trades,

            equityCurve:
                simulation.equityCurve

        };

    }


    // ========================================================
    // LOAD HISTORICAL CANDLES
    // ========================================================

    static async loadHistoricalCandles(
        config
    ) {

        const history =
            new CandleHistory();


        const candles =
            await history.getOHLCV(
                config.symbol,
                config.timeframe,
                config.candleLimit
            );


        return candles || [];

    }


    // ========================================================
    // NORMALIZE CONFIG
    // ========================================================

    static normalizeConfig(
        options = {}
    ) {

        const stopLoss = {

            ...this.DEFAULTS.stopLoss,

            ...(options.stopLoss || {})

        };


        const takeProfit = {

            ...this.DEFAULTS.takeProfit,

            ...(options.takeProfit || {})

        };


        const trailing = {

            ...this.DEFAULTS.trailing,

            ...(options.trailing || {})

        };


        const positionSizing = {

            ...this.DEFAULTS.positionSizing,

            ...(options.positionSizing || {})

        };


        return {

            ...this.DEFAULTS,

            ...options,

            stopLoss,

            takeProfit,

            trailing,

            positionSizing

        };

    }


    // ========================================================
    // NORMALIZE CANDLES
    // ========================================================

    static normalizeCandles(
        candles
    ) {

        return candles

            .map(
                candle => {

                    const openTime =
                        Number(
                            candle.openTime ??
                            candle.timestamp ??
                            candle.time
                        );


                    const closeTime =
                        Number(
                            candle.closeTime ??
                            openTime
                        );


                    return {

                        symbol:
                            candle.symbol,

                        interval:
                            candle.interval,

                        openTime,

                        closeTime,

                        open:
                            Number(
                                candle.open
                            ),

                        high:
                            Number(
                                candle.high
                            ),

                        low:
                            Number(
                                candle.low
                            ),

                        close:
                            Number(
                                candle.close
                            ),

                        volume:
                            Number(
                                candle.volume
                            )

                    };

                }
            )

            .filter(
                candle =>

                    Number.isFinite(
                        candle.openTime
                    ) &&

                    Number.isFinite(
                        candle.open
                    ) &&

                    Number.isFinite(
                        candle.high
                    ) &&

                    Number.isFinite(
                        candle.low
                    ) &&

                    Number.isFinite(
                        candle.close
                    ) &&

                    Number.isFinite(
                        candle.volume
                    )
            )

            .sort(
                (
                    a,
                    b
                ) =>
                    a.openTime -
                    b.openTime
            );

    }


    // ========================================================
    // BUILD INDICATORS
    // ========================================================

    static buildIndicators(
        candles,
        config
    ) {

        const result = [];


        /*
         * C3 STRATEGY SETTINGS
         *
         * Use calibration override when supplied.
         * Otherwise use the normal strategySettings.
         *
         * IMPORTANT:
         * This only reads the override.
         * It never modifies strategySettings.
         */

        const settings =
            config.strategySettingsOverride &&
            typeof config.strategySettingsOverride === "object"
                ? config.strategySettingsOverride
                : strategySettings;


        const rsiPeriod =
            Number(
                settings.rsi?.period ||
                14
            );


        const emaFast =
            Number(
                settings.ema?.fast ||
                11
            );


        const emaSlow =
            Number(
                settings.ema?.slow ||
                50
            );


        const macdFast =
            Number(
                settings.macd?.fast ||
                12
            );


        const macdSlow =
            Number(
                settings.macd?.slow ||
                26
            );


        const macdSignal =
            Number(
                settings.macd?.signal ||
                9
            );


        const volumePeriod =
            Number(
                settings.volume?.period ||
                20
            );


        // ====================================================
        // STOP LOSS ATR
        // ====================================================

        const atrPeriod =
            Number(
                config.stopLoss?.atrPeriod ||
                14
            );


        // ====================================================
        // TRAILING STOP ATR
        // ====================================================

        const trailingAtrPeriod =
            Number(
                config.trailing?.atrPeriod ||
                14
            );


        const closes =
            candles.map(
                candle =>
                    candle.close
            );


        const volumes =
            candles.map(
                candle =>
                    candle.volume
            );


        const rsiValues =
            this.calculateRSI(
                closes,
                rsiPeriod
            );


        const emaFastValues =
            this.calculateEMA(
                closes,
                emaFast
            );


        const emaSlowValues =
            this.calculateEMA(
                closes,
                emaSlow
            );


        const macdValues =
            this.calculateMACD(
                closes,
                macdFast,
                macdSlow,
                macdSignal
            );


        const atrValues =
            this.calculateATR(
                candles,
                atrPeriod
            );


        const trailingAtrValues =
            this.calculateATR(
                candles,
                trailingAtrPeriod
            );


        for (
            let i = 0;
            i < candles.length;
            i++
        ) {

            const volumeRelative =
                this.calculateVolumeRelative(
                    volumes,
                    i,
                    volumePeriod
                );


            result.push({

                RSI:
                    rsiValues[i],

                EMA_FAST:
                    emaFastValues[i] !== null
                        ? {
                            value:
                                emaFastValues[i]
                        }
                        : null,

                EMA_SLOW:
                    emaSlowValues[i] !== null
                        ? {
                            value:
                                emaSlowValues[i]
                        }
                        : null,

                MACD:
                    macdValues[i],

                Volume:
                    volumeRelative !== null
                        ? {
                            relative:
                                volumeRelative
                        }
                        : null,

                ATR:
                    atrValues[i],

                TRAILING_ATR:
                    trailingAtrValues[i]

            });

        }


        return result;

    }


    // ========================================================
    // RSI
    // ========================================================

    static calculateRSI(
        closes,
        period
    ) {

        const values =
            new Array(
                closes.length
            ).fill(null);


        if (
            closes.length <= period
        ) {

            return values;

        }


        let gains = 0;

        let losses = 0;


        for (
            let i = 1;
            i <= period;
            i++
        ) {

            const change =
                closes[i] -
                closes[i - 1];


            if (
                change >= 0
            ) {

                gains +=
                    change;

            }

            else {

                losses +=
                    Math.abs(
                        change
                    );

            }

        }


        let averageGain =
            gains /
            period;


        let averageLoss =
            losses /
            period;


        values[period] =
            this.rsiFromAverages(
                averageGain,
                averageLoss
            );


        for (
            let i = period + 1;
            i < closes.length;
            i++
        ) {

            const change =
                closes[i] -
                closes[i - 1];


            const gain =
                change > 0
                    ? change
                    : 0;


            const loss =
                change < 0
                    ? Math.abs(change)
                    : 0;


            averageGain =
                (
                    (
                        averageGain *
                        (period - 1)
                    ) +
                    gain
                ) /
                period;


            averageLoss =
                (
                    (
                        averageLoss *
                        (period - 1)
                    ) +
                    loss
                ) /
                period;


            values[i] =
                this.rsiFromAverages(
                    averageGain,
                    averageLoss
                );

        }


        return values;

    }


    static rsiFromAverages(
        averageGain,
        averageLoss
    ) {

        if (
            averageLoss === 0
        ) {

            return 100;

        }


        const rs =
            averageGain /
            averageLoss;


        return (
            100 -
            (
                100 /
                (1 + rs)
            )
        );

    }


    // ========================================================
    // EMA
    // ========================================================

    static calculateEMA(
        closes,
        period
    ) {

        const values =
            new Array(
                closes.length
            ).fill(null);


        if (
            closes.length < period
        ) {

            return values;

        }


        let sum = 0;


        for (
            let i = 0;
            i < period;
            i++
        ) {

            sum +=
                closes[i];

        }


        let ema =
            sum /
            period;


        values[period - 1] =
            ema;


        const multiplier =
            2 /
            (period + 1);


        for (
            let i = period;
            i < closes.length;
            i++
        ) {

            ema =
                (
                    (
                        closes[i] -
                        ema
                    ) *
                    multiplier
                ) +
                ema;


            values[i] =
                ema;

        }


        return values;

    }


    // ========================================================
    // MACD
    // ========================================================

    static calculateMACD(
        closes,
        fastPeriod,
        slowPeriod,
        signalPeriod
    ) {

        const fast =
            this.calculateEMA(
                closes,
                fastPeriod
            );


        const slow =
            this.calculateEMA(
                closes,
                slowPeriod
            );


        const macdLine =
            new Array(
                closes.length
            ).fill(null);


        const signalLine =
            new Array(
                closes.length
            ).fill(null);


        const histogram =
            new Array(
                closes.length
            ).fill(null);


        const rawMacd = [];


        for (
            let i = 0;
            i < closes.length;
            i++
        ) {

            if (
                fast[i] === null ||
                slow[i] === null
            ) {

                rawMacd.push(null);

                continue;

            }


            macdLine[i] =
                fast[i] -
                slow[i];


            rawMacd.push(
                macdLine[i]
            );

        }


        const valid = [];


        for (
            let i = 0;
            i < rawMacd.length;
            i++
        ) {

            if (
                rawMacd[i] !== null
            ) {

                valid.push({

                    index:
                        i,

                    value:
                        rawMacd[i]

                });

            }

        }


        if (
            valid.length >=
            signalPeriod
        ) {

            let sum = 0;


            for (
                let i = 0;
                i < signalPeriod;
                i++
            ) {

                sum +=
                    valid[i].value;

            }


            let signal =
                sum /
                signalPeriod;


            signalLine[
                valid[
                    signalPeriod - 1
                ].index
            ] =
                signal;


            const multiplier =
                2 /
                (signalPeriod + 1);


            for (
                let i = signalPeriod;
                i < valid.length;
                i++
            ) {

                signal =
                    (
                        (
                            valid[i].value -
                            signal
                        ) *
                        multiplier
                    ) +
                    signal;


                signalLine[
                    valid[i].index
                ] =
                    signal;

            }

        }


        for (
            let i = 0;
            i < closes.length;
            i++
        ) {

            if (
                macdLine[i] !== null &&
                signalLine[i] !== null
            ) {

                histogram[i] =
                    macdLine[i] -
                    signalLine[i];

            }

        }


        return closes.map(
            (
                _,
                i
            ) => {

                if (
                    histogram[i] === null
                ) {

                    return null;

                }


                return {

                    macd:
                        macdLine[i],

                    signal:
                        signalLine[i],

                    histogram:
                        histogram[i]

                };

            }
        );

    }


    // ========================================================
    // ATR
    // ========================================================

    static calculateATR(
        candles,
        period
    ) {

        const values =
            new Array(
                candles.length
            ).fill(null);


        if (
            candles.length <= period
        ) {

            return values;

        }


        const trueRanges =
            new Array(
                candles.length
            ).fill(null);


        for (
            let i = 1;
            i < candles.length;
            i++
        ) {

            const high =
                candles[i].high;


            const low =
                candles[i].low;


            const previousClose =
                candles[i - 1].close;


            trueRanges[i] =
                Math.max(

                    high - low,

                    Math.abs(
                        high -
                        previousClose
                    ),

                    Math.abs(
                        low -
                        previousClose
                    )

                );

        }


        let sum = 0;


        for (
            let i = 1;
            i <= period;
            i++
        ) {

            sum +=
                trueRanges[i];

        }


        let atr =
            sum /
            period;


        values[period] =
            atr;


        for (
            let i = period + 1;
            i < candles.length;
            i++
        ) {

            atr =
                (
                    (
                        atr *
                        (period - 1)
                    ) +
                    trueRanges[i]
                ) /
                period;


            values[i] =
                atr;

        }


        return values;

    }


    // ========================================================
    // VOLUME RELATIVE
    // ========================================================

    static calculateVolumeRelative(
        volumes,
        index,
        period
    ) {

        if (
            index < period
        ) {

            return null;

        }


        let sum = 0;


        for (
            let i = index - period;
            i < index;
            i++
        ) {

            sum +=
                volumes[i];

        }


        const average =
            sum /
            period;


        if (
            average <= 0
        ) {

            return null;

        }


        return (
            volumes[index] /
            average
        );

    }


    // ========================================================
    // SIMULATION
    // ========================================================

    static simulate(
        candles,
        indicators,
        config
    ) {

        let balance =
            Number(
                config.initialBalance
            );


        let position =
            null;


        let pendingSignal =
            null;


        const trades = [];


        const equityCurve = [];


        for (
            let i = 0;
            i < candles.length;
            i++
        ) {

            const candle =
                candles[i];


            const indicator =
                indicators[i];


            // =================================================
            // 1. MANAGE EXISTING POSITION
            // =================================================

            if (position) {

                const management =
                    this.managePosition(
                        position,
                        candle,
                        indicators,
                        candles,
                        i,
                        config
                    );


                if (
                    management.closed
                ) {

                    balance +=
                        management.grossPnl -
                        management.exitFee;


                    trades.push(
                        management.trade
                    );


                    position =
                        null;

                }

            }


            // =================================================
            // 2. OPEN PENDING SIGNAL
            // =================================================

            if (
                !position &&
                pendingSignal
            ) {

                const entryIndicator =
                    pendingSignal.indicator;


                if (
                    entryIndicator &&
                    Number.isFinite(
                        entryIndicator.ATR
                    ) &&
                    entryIndicator.ATR > 0
                ) {

                    position =
                        this.openPosition(
                            pendingSignal.signal,
                            candle,
                            entryIndicator,
                            config,
                            candle.open,
                            balance
                        );


                    if (position) {

                        balance -=
                            position.entryFee;

                    }

                }


                pendingSignal =
                    null;

            }


            // =================================================
            // 3. MANAGE NEW POSITION
            // =================================================

            if (position) {

                const management =
                    this.managePosition(
                        position,
                        candle,
                        indicators,
                        candles,
                        i,
                        config
                    );


                if (
                    management.closed
                ) {

                    balance +=
                        management.grossPnl -
                        management.exitFee;


                    trades.push(
                        management.trade
                    );


                    position =
                        null;

                }

            }


            // =================================================
            // 4. EQUITY CURVE
            // =================================================

            const unrealized =
                position
                    ? this.calculateUnrealizedPnl(
                        position,
                        candle.close
                    )
                    : 0;


            equityCurve.push({

                time:
                    candle.closeTime ||
                    candle.openTime,

                equity:
                    balance +
                    unrealized

            });


            // =================================================
            // 5. GENERATE SIGNAL
            // =================================================

            if (
                !position &&
                !pendingSignal
            ) {

                if (
                    !indicator ||
                    !Number.isFinite(
                        indicator.ATR
                    ) ||
                    indicator.ATR <= 0
                ) {

                    continue;

                }


                const signal =
                    this.calculateSignal(
                        indicator,
                        config
                    );


                if (
                    signal.signal !== "LONG" &&
                    signal.signal !== "SHORT"
                ) {

                    continue;

                }


                if (
                    i >=
                    candles.length - 1
                ) {

                    continue;

                }


                pendingSignal = {

                    signal,

                    indicator

                };

            }

        }


        // =====================================================
        // FORCE CLOSE AT END OF DATA
        // =====================================================

        if (position) {

            const finalCandle =
                candles[
                    candles.length - 1
                ];


            const exitPrice =
                finalCandle.close;


            const grossPnl =
                this.calculateGrossPnl(
                    position,
                    exitPrice
                );


            const exitFee =
                this.calculateFee(
                    exitPrice *
                    position.quantity,
                    config
                );


            const totalFees =
                position.entryFee +
                exitFee;


            const netPnl =
                grossPnl -
                totalFees;


            balance +=
                grossPnl -
                exitFee;


            const forcedTrade = {

                ...position,

                exitPrice,

                exitTime:
                    finalCandle.closeTime ||
                    finalCandle.openTime,

                exitReason:
                    "END_OF_DATA",

                grossPnl,

                exitFee,

                fees:
                    totalFees,

                netPnl

            };


            trades.push(
                forcedTrade
            );


            equityCurve.push({

                time:
                    finalCandle.closeTime ||
                    finalCandle.openTime,

                equity:
                    balance

            });


            position =
                null;

        }


        return {

            finalBalance:
                balance,

            trades,

            equityCurve

        };

    }


    // ========================================================
    // SIGNAL ENGINE
    // ========================================================

    static calculateSignal(
        indicators,
        config
    ) {

        return SignalEngine.calculate(
            indicators,
            config?.strategySettingsOverride || null
        );

    }


    // ========================================================
    // OPEN POSITION
    // ========================================================

    static openPosition(
        signal,
        candle,
        indicator,
        config,
        executionPrice = candle.open,
        balance = config.initialBalance
    ) {

        const side =
            signal.signal;


        let entryPrice =
            Number(
                executionPrice
            );


        if (
            !Number.isFinite(
                entryPrice
            ) ||
            entryPrice <= 0
        ) {

            return null;

        }


        // =====================================================
        // SLIPPAGE
        // =====================================================

        const slippage =
            Number(
                config.slippageRate || 0
            );


        if (
            side === "LONG"
        ) {

            entryPrice *=
                (
                    1 +
                    slippage
                );

        }

        else {

            entryPrice *=
                (
                    1 -
                    slippage
                );

        }


        // =====================================================
        // ATR
        // =====================================================

        const atr =
            Number(
                indicator.ATR
            );


        if (
            !Number.isFinite(atr) ||
            atr <= 0
        ) {

            return null;

        }


        // =====================================================
        // INITIAL STOP LOSS
        // =====================================================

        let stopLoss =
            null;


        if (
            config.stopLoss.enabled
        ) {

            const multiplier =
                Number(
                    config.stopLoss.atrMultiplier
                );


            if (
                side === "LONG"
            ) {

                stopLoss =
                    entryPrice -
                    (
                        atr *
                        multiplier
                    );

            }

            else {

                stopLoss =
                    entryPrice +
                    (
                        atr *
                        multiplier
                    );

            }

        }


        // =====================================================
        // TAKE PROFIT
        // =====================================================

        let takeProfit =
            null;


        const takeProfitMode =
            String(
                config.takeProfit.mode ??
                "FIXED_RR"
            )
                .trim()
                .toUpperCase();


        // =====================================================
        // FIXED RR
        // =====================================================

        if (
            config.takeProfit.enabled &&
            takeProfitMode === "FIXED_RR" &&
            stopLoss !== null
        ) {

            const riskDistance =
                Math.abs(
                    entryPrice -
                    stopLoss
                );


            const rr =
                Number(
                    config.takeProfit.rrRatio
                );


            if (
                Number.isFinite(rr) &&
                rr > 0
            ) {

                if (
                    side === "LONG"
                ) {

                    takeProfit =
                        entryPrice +
                        (
                            riskDistance *
                            rr
                        );

                }

                else {

                    takeProfit =
                        entryPrice -
                        (
                            riskDistance *
                            rr
                        );

                }

            }

        }


        // =====================================================
        // TRAILING-ONLY MODE
        // =====================================================

        if (
            takeProfitMode === "TRAILING"
        ) {

            takeProfit =
                null;

        }


        // =====================================================
        // PRODUCTION-ALIGNED POSITION SIZING
        // =====================================================

        const sizing =
            config.positionSizing || {};


        const wallet =
            Number(balance);


        const minimumBalance =
            Number(
                sizing.minBalanceToTrade ?? 5
            );


        if (
            !Number.isFinite(wallet) ||
            wallet < minimumBalance
        ) {

            return null;

        }


        const positionMode =
            String(
                sizing.positionMode ?? "AUTO"
            )
                .trim()
                .toUpperCase();


        const leverage =
            Number(
                sizing.leverage ?? 1
            );


        if (
            !Number.isFinite(leverage) ||
            leverage <= 0
        ) {

            return null;

        }


        const positionSizePercent =
            Number(
                sizing.positionSizePercent ?? 10
            );


        const fixedLot =
            Number(
                sizing.fixedLot ?? 0.01
            );


        const maxPositionSize =
            Number(
                sizing.maxPositionSize ?? 100
            );


        const minimumOrderSize =
            Number(
                sizing.minimumOrderSize ?? 10
            );


        const useBalancePercent =
            sizing.useBalancePercent !== false;


        const riskPerTradePercent =
            Number(
                sizing.riskPerTrade ?? 1
            );


        const maxLossPerTradePercent =
            Number(
                sizing.maxLossPerTrade ?? 2
            );


        let quantity =
            0;


        // =====================================================
        // FIXED MODE
        // =====================================================

        if (
            positionMode === "FIXED"
        ) {

            quantity =
                fixedLot;

        }

        // =====================================================
        // AUTO MODE
        // =====================================================

        else {

            // -------------------------------------------------
            // Balance-percent cap
            // -------------------------------------------------

            if (
                useBalancePercent
            ) {

                const positionValue =
                    wallet *
                    (
                        positionSizePercent /
                        100
                    );


                quantity =
                    positionValue /
                    entryPrice;

            }


            // -------------------------------------------------
            // Risk-based sizing
            // -------------------------------------------------

            if (
                stopLoss !== null
            ) {

                const stopDistance =
                    Math.abs(
                        entryPrice -
                        Number(stopLoss)
                    );


                if (
                    stopDistance > 0
                ) {

                    const effectiveRiskPercent =
                        Math.min(
                            riskPerTradePercent,
                            maxLossPerTradePercent
                        );


                    const riskAmount =
                        wallet *
                        (
                            effectiveRiskPercent /
                            100
                        );


                    const riskQuantity =
                        riskAmount /
                        stopDistance;


                    if (
                        useBalancePercent
                    ) {

                        quantity =
                            Math.min(
                                quantity,
                                riskQuantity
                            );

                    }

                    else {

                        quantity =
                            riskQuantity;

                    }

                }

            }

        }


        // =====================================================
        // MAX POSITION SIZE
        // =====================================================

        if (
            maxPositionSize > 0
        ) {

            const maxQuantity =
                maxPositionSize /
                entryPrice;


            quantity =
                Math.min(
                    quantity,
                    maxQuantity
                );

        }


        // =====================================================
        // MINIMUM ORDER SIZE
        // =====================================================

        if (
            minimumOrderSize > 0
        ) {

            const minimumQuantity =
                minimumOrderSize /
                entryPrice;


            if (
                quantity <
                minimumQuantity
            ) {

                return null;

            }

        }


        // =====================================================
        // LEVERAGE
        // =====================================================

        quantity *=
            leverage;


        quantity =
            Number(
                quantity.toFixed(6)
            );


        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            return null;

        }


        // =====================================================
        // ENTRY FEE
        // =====================================================

        const entryNotional =
            entryPrice *
            quantity;


        const entryFee =
            this.calculateFee(
                entryNotional,
                config
            );


        return {

            side,

            entryPrice,

            entryTime:
                candle.openTime,

            quantity,

            atr,

            stopLoss,

            initialStopLoss:
                stopLoss,

            takeProfit,

            takeProfitMode,

            trailingStop:
                null,

            trailingActivated:
                false,

            entryFee,

            signalConfidence:
                signal.confidence,

            signalScore:
                signal.signalScore,

            buyScore:
                signal.buyScore,

            sellScore:
                signal.sellScore,

            // =================================================
            // C3 DIAGNOSTIC DATA
            // =================================================

            signalDetails:
                signal.details
                    ? {
                        ...signal.details
                    }
                    : null,

            barsInTrade:
                0

        };

    }


    // ========================================================
    // MANAGE POSITION
    // ========================================================

    static managePosition(
        position,
        candle,
        indicators,
        candles,
        index,
        config
    ) {

        position.barsInTrade++;


        // =====================================================
        // TRAILING
        // =====================================================

        if (
            config.trailing.enabled
        ) {

            this.updateTrailingStop(
                position,
                candle,
                indicators,
                candles,
                index,
                config
            );

        }


        let exitPrice =
            null;


        let exitReason =
            null;


        // =====================================================
        // LONG
        // =====================================================

        if (
            position.side === "LONG"
        ) {

            let activeStop =
                position.stopLoss;


            if (
                position.trailingStop !== null
            ) {

                activeStop =
                    Math.max(
                        position.stopLoss,
                        position.trailingStop
                    );

            }


            position.stopLoss =
                activeStop;


            /*
             * Conservative intrabar rule:
             * If SL and TP are both touched by the same
             * candle, SL is assumed first.
             */

            if (
                activeStop !== null &&
                candle.low <= activeStop
            ) {

                exitPrice =
                    activeStop;


                exitReason =
                    position.trailingStop !== null &&
                    activeStop === position.trailingStop
                        ? "TRAILING_STOP"
                        : "STOP_LOSS";

            }

            else if (
                position.takeProfit !== null &&
                candle.high >=
                    position.takeProfit
            ) {

                exitPrice =
                    position.takeProfit;


                exitReason =
                    "TAKE_PROFIT";

            }

        }

        // =====================================================
        // SHORT
        // =====================================================

        else {

            let activeStop =
                position.stopLoss;


            if (
                position.trailingStop !== null
            ) {

                activeStop =
                    Math.min(
                        position.stopLoss,
                        position.trailingStop
                    );

            }


            position.stopLoss =
                activeStop;


            if (
                activeStop !== null &&
                candle.high >= activeStop
            ) {

                exitPrice =
                    activeStop;


                exitReason =
                    position.trailingStop !== null &&
                    activeStop === position.trailingStop
                        ? "TRAILING_STOP"
                        : "STOP_LOSS";

            }

            else if (
                position.takeProfit !== null &&
                candle.low <=
                    position.takeProfit
            ) {

                exitPrice =
                    position.takeProfit;


                exitReason =
                    "TAKE_PROFIT";

            }

        }


        // =====================================================
        // MAX BARS
        // =====================================================

        if (
            !exitReason &&
            Number(
                config.maxBarsInTrade
            ) > 0 &&
            position.barsInTrade >=
                Number(
                    config.maxBarsInTrade
                )
        ) {

            exitPrice =
                candle.close;


            exitReason =
                "MAX_BARS";

        }


        if (
            !exitReason
        ) {

            return {

                closed:
                    false

            };

        }


        // =====================================================
        // PNL
        // =====================================================

        const grossPnl =
            this.calculateGrossPnl(
                position,
                exitPrice
            );


        const exitFee =
            this.calculateFee(
                exitPrice *
                position.quantity,
                config
            );


        const totalFees =
            position.entryFee +
            exitFee;


        const netPnl =
            grossPnl -
            totalFees;


        return {

            closed:
                true,

            grossPnl,

            exitFee,

            netPnl,

            trade: {

                ...position,

                exitPrice,

                exitTime:
                    candle.closeTime ||
                    candle.openTime,

                exitReason,

                grossPnl,

                exitFee,

                fees:
                    totalFees,

                netPnl

            }

        };

    }


    // ========================================================
    // TRAILING STOP
    // ========================================================

    static updateTrailingStop(
        position,
        candle,
        indicators,
        candles,
        index,
        config
    ) {

        /*
         * =====================================================
         * TRAILING MODES
         * =====================================================
         *
         * CHANDELIER:
         *
         * LONG:
         * highestHigh(previous lookback)
         * -
         * TRAILING ATR * multiplier
         *
         * SHORT:
         * lowestLow(previous lookback)
         * +
         * TRAILING ATR * multiplier
         *
         *
         * VOLATILITY:
         *
         * LONG:
         * previousClose
         * -
         * TRAILING ATR * multiplier
         *
         * SHORT:
         * previousClose
         * +
         * TRAILING ATR * multiplier
         *
         *
         * ACTIVATION:
         *
         * LONG:
         * previousClose must reach
         * entryPrice * (1 + activationPercent)
         *
         * SHORT:
         * previousClose must reach
         * entryPrice * (1 - activationPercent)
         *
         *
         * IMPORTANT:
         * - Current candle is excluded from the calculation.
         * - Previous candle's ATR is used.
         * - Previous candle's close is used for activation.
         * - No lookahead is introduced.
         * - The stop only moves in the favorable direction.
         * - Chandelier behavior remains unchanged.
         * =====================================================
         */


        const mode =
            String(
                config.trailing.mode ?? ""
            )
                .trim()
                .toUpperCase();


        // =====================================================
        // SUPPORTED MODES
        // =====================================================

        if (
            mode !== "CHANDELIER" &&
            mode !== "VOLATILITY"
        ) {

            return;

        }


        if (
            index <= 0
        ) {

            return;

        }


        const previousIndex =
            index - 1;


        const previousCandle =
            candles[previousIndex];


        if (!previousCandle) {

            return;

        }


        // =====================================================
        // PREVIOUS INDICATOR
        // =====================================================

        const previousIndicator =
            indicators[previousIndex];


        if (!previousIndicator) {

            return;

        }


        // =====================================================
        // TRAILING ATR
        // =====================================================

        const atr =
            Number(
                previousIndicator.TRAILING_ATR
            );


        if (
            !Number.isFinite(atr) ||
            atr <= 0
        ) {

            return;

        }


        // =====================================================
        // MULTIPLIER
        // =====================================================

        const multiplier =
            Number(
                config.trailing.atrMultiplier ?? 3
            );


        if (
            !Number.isFinite(multiplier) ||
            multiplier <= 0
        ) {

            return;

        }


        // =====================================================
        // VOLATILITY STOP
        // =====================================================

        if (
            mode === "VOLATILITY"
        ) {

            // =================================================
            // DO NOT ACTIVATE VOLATILITY TRAILING
            // ON THE ENTRY CANDLE
            // =================================================

            if (
                position.barsInTrade <= 1
            ) {

                return;

            }


            const previousClose =
                Number(
                    previousCandle.close
                );


            if (
                !Number.isFinite(previousClose) ||
                previousClose <= 0
            ) {

                return;

            }


            // =================================================
            // ACTIVATION PERCENT
            // =================================================

            const activationPercent =
                Math.max(
                    0,
                    Number(
                        config.trailing.activationPercent ?? 0
                    )
                ) / 100;


            // =================================================
            // LONG VOLATILITY STOP
            // =================================================

            if (
                position.side === "LONG"
            ) {

                /*
                 * If activationPercent is greater than zero,
                 * the previous candle close must first reach
                 * the required favorable movement from entry.
                 *
                 * Example:
                 *
                 * activationPercent = 1
                 *
                 * Entry = 100
                 * Required previous close >= 101
                 *
                 * With activationPercent = 0 this condition
                 * is skipped and the previous behavior remains
                 * unchanged.
                 */

                if (
                    activationPercent > 0 &&
                    position.trailingActivated !== true
                ) {

                    const activationPrice =
                        position.entryPrice *
                        (
                            1 +
                            activationPercent
                        );


                    if (
                        previousClose <
                        activationPrice
                    ) {

                        return;

                    }

                }


                const volatilityStop =
                    previousClose -
                    (
                        atr *
                        multiplier
                    );


                if (
                    !Number.isFinite(
                        volatilityStop
                    )
                ) {

                    return;

                }


                /*
                 * A long trailing stop must remain below
                 * the reference price. If an extreme multiplier
                 * produces a non-positive level, ignore it.
                 */

                if (
                    volatilityStop <= 0
                ) {

                    return;

                }


                if (
                    position.trailingStop === null
                ) {

                    position.trailingStop =
                        volatilityStop;

                }

                else {

                    position.trailingStop =
                        Math.max(
                            position.trailingStop,
                            volatilityStop
                        );

                }


                position.trailingActivated =
                    true;


                return;

            }


            // =================================================
            // SHORT VOLATILITY STOP
            // =================================================

            /*
             * For SHORT positions the favorable movement
             * is downward from the entry price.
             *
             * Example:
             *
             * activationPercent = 1
             *
             * Entry = 100
             * Required previous close <= 99
             */

            if (
                activationPercent > 0 &&
                position.trailingActivated !== true
            ) {

                const activationPrice =
                    position.entryPrice *
                    (
                        1 -
                        activationPercent
                    );


                if (
                    previousClose >
                    activationPrice
                ) {

                    return;

                }

            }


            const volatilityStop =
                previousClose +
                (
                    atr *
                    multiplier
                );


            if (
                !Number.isFinite(
                    volatilityStop
                )
            ) {

                return;

            }


            if (
                volatilityStop <= 0
            ) {

                return;

            }


            if (
                position.trailingStop === null
            ) {

                position.trailingStop =
                    volatilityStop;

            }

            else {

                position.trailingStop =
                    Math.min(
                        position.trailingStop,
                        volatilityStop
                    );

            }


            position.trailingActivated =
                true;


            return;

        }


        // =====================================================
        // CHANDELIER TRAILING
        // =====================================================

        const lookback =
            Math.max(
                1,
                Math.floor(
                    Number(
                        config.trailing.chandelierLookback ??
                        22
                    )
                )
            );


        const startIndex =
            Math.max(
                0,
                previousIndex -
                lookback +
                1
            );


        // =====================================================
        // LONG
        // =====================================================

        if (
            position.side === "LONG"
        ) {

            let highest =
                -Infinity;


            for (
                let i = startIndex;
                i <= previousIndex;
                i++
            ) {

                const high =
                    Number(
                        candles[i]?.high
                    );


                if (
                    Number.isFinite(high)
                ) {

                    highest =
                        Math.max(
                            highest,
                            high
                        );

                }

            }


            if (
                !Number.isFinite(highest)
            ) {

                return;

            }


            const trailingStop =
                highest -
                (
                    atr *
                    multiplier
                );


            if (
                position.trailingStop === null
            ) {

                position.trailingStop =
                    trailingStop;

            }

            else {

                position.trailingStop =
                    Math.max(
                        position.trailingStop,
                        trailingStop
                    );

            }


            position.trailingActivated =
                true;


            return;

        }


        // =====================================================
        // SHORT
        // =====================================================

        let lowest =
            Infinity;


        for (
            let i = startIndex;
            i <= previousIndex;
            i++
        ) {

            const low =
                Number(
                    candles[i]?.low
                );


            if (
                Number.isFinite(low)
            ) {

                lowest =
                    Math.min(
                        lowest,
                        low
                    );

            }

        }


        if (
            !Number.isFinite(lowest)
        ) {

            return;

        }


        const trailingStop =
            lowest +
            (
                atr *
                multiplier
            );


        if (
            position.trailingStop === null
        ) {

            position.trailingStop =
                trailingStop;

        }

        else {

            position.trailingStop =
                Math.min(
                    position.trailingStop,
                    trailingStop
                );

        }


        position.trailingActivated =
            true;

    }


    // ========================================================
    // GROSS PNL
    // ========================================================

    static calculateGrossPnl(
        position,
        exitPrice
    ) {

        if (
            position.side === "LONG"
        ) {

            return (
                exitPrice -
                position.entryPrice
            ) *
            position.quantity;

        }


        return (
            position.entryPrice -
            exitPrice
        ) *
        position.quantity;

    }


    // ========================================================
    // UNREALIZED PNL
    // ========================================================

    static calculateUnrealizedPnl(
        position,
        price
    ) {

        return this.calculateGrossPnl(
            position,
            price
        );

    }


    // ========================================================
    // FEE
    // ========================================================

    static calculateFee(
        notional,
        config
    ) {

        const feeRate =
            Number(
                config.feeRate || 0
            );


        return (
            Math.abs(
                Number(
                    notional
                )
            ) *
            feeRate
        );

    }


    // ========================================================
    // METRICS
    // ========================================================

    static calculateMetrics(
        simulation,
        config
    ) {

        const trades =
            simulation.trades || [];


        const initialBalance =
            Number(
                config.initialBalance
            );


        const finalBalance =
            Number(
                simulation.finalBalance
            );


        const netProfit =
            finalBalance -
            initialBalance;


        // =====================================================
        // WINS / LOSSES
        // =====================================================

        const wins =
            trades.filter(
                trade =>
                    Number(
                        trade.netPnl
                    ) > 0
            );


        const losses =
            trades.filter(
                trade =>
                    Number(
                        trade.netPnl
                    ) < 0
            );


        // =====================================================
        // NET GROSS PROFIT
        // =====================================================

        const grossProfit =
            wins.reduce(
                (
                    total,
                    trade
                ) =>
                    total +
                    Number(
                        trade.netPnl
                    ),
                0
            );


        // =====================================================
        // NET GROSS LOSS
        // =====================================================

        const grossLoss =
            Math.abs(
                losses.reduce(
                    (
                        total,
                        trade
                    ) =>
                        total +
                        Number(
                            trade.netPnl
                        ),
                    0
                )
            );


        // =====================================================
        // RAW GROSS PROFIT BEFORE FEES
        // =====================================================

        const grossProfitBeforeFees =
            trades.reduce(
                (
                    total,
                    trade
                ) => {

                    const grossPnl =
                        Number(
                            trade.grossPnl || 0
                        );


                    return (
                        grossPnl > 0
                            ? total + grossPnl
                            : total
                    );

                },
                0
            );


        // =====================================================
        // RAW GROSS LOSS BEFORE FEES
        // =====================================================

        const grossLossBeforeFees =
            Math.abs(
                trades.reduce(
                    (
                        total,
                        trade
                    ) => {

                        const grossPnl =
                            Number(
                                trade.grossPnl || 0
                            );


                        return (
                            grossPnl < 0
                                ? total + grossPnl
                                : total
                        );

                    },
                    0
                )
            );


        // =====================================================
        // PROFIT FACTOR
        // =====================================================

        let profitFactor =
            0;


        if (
            grossLoss > 0
        ) {

            profitFactor =
                grossProfit /
                grossLoss;

        }

        else if (
            grossProfit > 0
        ) {

            profitFactor =
                Infinity;

        }


        // =====================================================
        // WIN RATE
        // =====================================================

        const winRate =
            trades.length > 0
                ? (
                    wins.length /
                    trades.length
                ) *
                100
                : 0;


        // =====================================================
        // EXPECTANCY
        // =====================================================

        const expectancy =
            trades.length > 0
                ? netProfit /
                  trades.length
                : 0;


        // =====================================================
        // AVERAGES
        // =====================================================

        const averageWin =
            wins.length > 0
                ? grossProfit /
                  wins.length
                : 0;


        const averageLoss =
            losses.length > 0
                ? grossLoss /
                  losses.length
                : 0;


        // =====================================================
        // FEES
        // =====================================================

        const totalFees =
            trades.reduce(
                (
                    total,
                    trade
                ) =>
                    total +
                    Number(
                        trade.fees || 0
                    ),
                0
            );


        // =====================================================
        // FEE / GROSS PROFIT RATIO
        // =====================================================

        const feePercentOfGrossProfit =
            grossProfitBeforeFees > 0
                ? (
                    totalFees /
                    grossProfitBeforeFees
                ) *
                100
                : 0;


        // =====================================================
        // CONSECUTIVE WINS / LOSSES
        // =====================================================

        let currentWinningStreak = 0;

        let currentLosingStreak = 0;

        let maxConsecutiveWins = 0;

        let maxConsecutiveLosses = 0;


        for (
            const trade of trades
        ) {

            const pnl =
                Number(
                    trade.netPnl
                );


            if (
                pnl > 0
            ) {

                currentWinningStreak++;

                currentLosingStreak = 0;


                maxConsecutiveWins =
                    Math.max(
                        maxConsecutiveWins,
                        currentWinningStreak
                    );

            }

            else if (
                pnl < 0
            ) {

                currentLosingStreak++;

                currentWinningStreak = 0;


                maxConsecutiveLosses =
                    Math.max(
                        maxConsecutiveLosses,
                        currentLosingStreak
                    );

            }

            else {

                currentWinningStreak = 0;

                currentLosingStreak = 0;

            }

        }


        // =====================================================
        // DRAWDOWN
        // =====================================================

        const maxDrawdown =
            this.calculateMaxDrawdown(
                simulation.equityCurve,
                initialBalance
            );


        // =====================================================
        // LONG / SHORT
        // =====================================================

        const longTrades =
            trades.filter(
                trade =>
                    trade.side ===
                    "LONG"
            );


        const shortTrades =
            trades.filter(
                trade =>
                    trade.side ===
                    "SHORT"
            );


        const longWins =
            longTrades.filter(
                trade =>
                    Number(
                        trade.netPnl
                    ) > 0
            );


        const shortWins =
            shortTrades.filter(
                trade =>
                    Number(
                        trade.netPnl
                    ) > 0
            );


        // =====================================================
        // EXIT REASONS
        // =====================================================

        const takeProfitTrades =
            trades.filter(
                trade =>
                    trade.exitReason ===
                    "TAKE_PROFIT"
            );


        const trailingStopTrades =
            trades.filter(
                trade =>
                    trade.exitReason ===
                    "TRAILING_STOP"
            );


        const stopLossTrades =
            trades.filter(
                trade =>
                    trade.exitReason ===
                    "STOP_LOSS"
            );


        const maxBarsTrades =
            trades.filter(
                trade =>
                    trade.exitReason ===
                    "MAX_BARS"
            );


        const endOfDataTrades =
            trades.filter(
                trade =>
                    trade.exitReason ===
                    "END_OF_DATA"
            );


        return {

            initialBalance,

            finalBalance,

            netProfit,

            netProfitPercent:
                initialBalance > 0
                    ? (
                        netProfit /
                        initialBalance
                    ) *
                    100
                    : 0,

            profitFactor,

            winRate,

            tradeCount:
                trades.length,

            winningTrades:
                wins.length,

            losingTrades:
                losses.length,

            averageWin,

            averageLoss,

            expectancy,

            grossProfit,

            grossLoss,

            grossProfitBeforeFees,

            grossLossBeforeFees,

            totalFees,

            feePercentOfGrossProfit,

            maxConsecutiveWins,

            maxConsecutiveLosses,

            maxDrawdown,

            maxDrawdownPercent:
                initialBalance > 0
                    ? (
                        maxDrawdown /
                        initialBalance
                    ) *
                    100
                    : 0,

            longTrades:
                longTrades.length,

            longWins:
                longWins.length,

            longWinRate:
                longTrades.length > 0
                    ? (
                        longWins.length /
                        longTrades.length
                    ) *
                    100
                    : 0,

            shortTrades:
                shortTrades.length,

            shortWins:
                shortWins.length,

            shortWinRate:
                shortTrades.length > 0
                    ? (
                        shortWins.length /
                        shortTrades.length
                    ) *
                    100
                    : 0,

            takeProfitTrades:
                takeProfitTrades.length,

            trailingStopTrades:
                trailingStopTrades.length,

            stopLossTrades:
                stopLossTrades.length,

            maxBarsTrades:
                maxBarsTrades.length,

            endOfDataTrades:
                endOfDataTrades.length

        };

    }


    // ========================================================
    // MAX DRAWDOWN
    // ========================================================

    static calculateMaxDrawdown(
        equityCurve,
        initialBalance
    ) {

        if (
            !Array.isArray(
                equityCurve
            ) ||
            equityCurve.length === 0
        ) {

            return 0;

        }


        let peak =
            Number(
                initialBalance
            );


        let maxDrawdown =
            0;


        for (
            const point of equityCurve
        ) {

            const equity =
                Number(
                    point.equity
                );


            if (
                !Number.isFinite(
                    equity
                )
            ) {

                continue;

            }


            if (
                equity > peak
            ) {

                peak =
                    equity;

            }


            const drawdown =
                peak -
                equity;


            if (
                drawdown >
                maxDrawdown
            ) {

                maxDrawdown =
                    drawdown;

            }

        }


        return maxDrawdown;

    }


    // ========================================================
    // SUPPORTED TIMEFRAMES
    // ========================================================

    static getSupportedTimeframes() {

        return [
            ...this.SUPPORTED_TIMEFRAMES
        ];

    }


    // ========================================================
    // MULTI-TIMEFRAME RUNNER
    // ========================================================

    static async runTimeframes(
        options = {}
    ) {

        const requested =
            Array.isArray(
                options.timeframes
            )
                ? options.timeframes
                : this.SUPPORTED_TIMEFRAMES;


        const results = {};


        for (
            const timeframe of requested
        ) {

            if (
                !this.SUPPORTED_TIMEFRAMES.includes(
                    timeframe
                )
            ) {

                continue;

            }


            results[timeframe] =
                await this.run({

                    ...options,

                    timeframe

                });

        }


        return results;

    }

}