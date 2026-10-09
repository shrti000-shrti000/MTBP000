import strategySettings from "../config/strategySettings.js";
import CalibrationEngine from "./CalibrationEngine.js";

/**
 * ============================================================
 * MTBP - Parameter Calibration Engine
 * ============================================================
 *
 * C3 - Parameter Calibration
 *
 * Purpose:
 * - Test controlled combinations of strategy parameters.
 * - Reuse the existing CalibrationEngine.
 * - Reuse the existing SignalEngine.
 * - Reuse the existing C2 performance metrics.
 *
 * IMPORTANT:
 * - This engine does NOT modify strategySettings.
 * - This engine does NOT place real orders.
 * - This engine does NOT modify Paper Account.
 * - This engine does NOT modify Live Account.
 * - Every test receives an isolated strategySettingsOverride.
 *
 * INITIAL C3 SEARCH:
 *
 * RSI BUY:
 *   25
 *   30
 *   35
 *
 * RSI SELL:
 *   65
 *   70
 *   75
 *
 * Total combinations:
 *   3 x 3 = 9
 *
 * Other strategy parameters remain at their current
 * production strategySettings values.
 * ============================================================
 */

export default class ParameterCalibrationEngine {

    // ========================================================
    // DEFAULT SEARCH SPACE
    // ========================================================

    static DEFAULT_SEARCH = {

        rsiBuyLevels: [
            25,
            30,
            35
        ],

        rsiSellLevels: [
            65,
            70,
            75
        ]

    };


    // ========================================================
    // MAIN RUN
    // ========================================================

    static async run(options = {}) {

        const search =
            this.normalizeSearch(
                options.search
            );


        const calibrationOptions =
            {
                ...options
            };


        delete calibrationOptions.search;


        delete calibrationOptions.strategySettingsOverride;


        const results = [];


        let combinationId = 0;


        for (
            const buyLevel of search.rsiBuyLevels
        ) {

            for (
                const sellLevel of search.rsiSellLevels
            ) {

                combinationId++;


                const strategyOverride =
                    this.createStrategyOverride({

                        rsiBuyLevel:
                            buyLevel,

                        rsiSellLevel:
                            sellLevel

                    });


                const calibrationResult =
                    await CalibrationEngine.run({

                        ...calibrationOptions,

                        strategySettingsOverride:
                            strategyOverride

                    });


                results.push({

                    combinationId,

                    parameters: {

                        rsiBuyLevel:
                            buyLevel,

                        rsiSellLevel:
                            sellLevel

                    },

                    metrics:
                        calibrationResult.metrics

                });

            }

        }


        return {

            success: true,

            symbol:
                calibrationOptions.symbol ??
                CalibrationEngine.DEFAULTS.symbol,

            timeframe:
                calibrationOptions.timeframe ??
                CalibrationEngine.DEFAULTS.timeframe,

            candleLimit:
                calibrationOptions.candleLimit ??
                CalibrationEngine.DEFAULTS.candleLimit,

            initialBalance:
                calibrationOptions.initialBalance ??
                CalibrationEngine.DEFAULTS.initialBalance,

            combinationCount:
                results.length,

            searchSpace: {

                rsiBuyLevels:
                    [
                        ...search.rsiBuyLevels
                    ],

                rsiSellLevels:
                    [
                        ...search.rsiSellLevels
                    ]

            },

            results

        };

    }


    // ========================================================
    // NORMALIZE SEARCH
    // ========================================================

    static normalizeSearch(
        search = {}
    ) {

        const requested =
            search &&
            typeof search === "object"
                ? search
                : {};


        const rsiBuyLevels =
            this.normalizeNumberArray(
                requested.rsiBuyLevels ??
                this.DEFAULT_SEARCH.rsiBuyLevels
            );


        const rsiSellLevels =
            this.normalizeNumberArray(
                requested.rsiSellLevels ??
                this.DEFAULT_SEARCH.rsiSellLevels
            );


        if (
            rsiBuyLevels.length === 0
        ) {

            throw new Error(
                "C3 calibration requires at least one RSI buy level."
            );

        }


        if (
            rsiSellLevels.length === 0
        ) {

            throw new Error(
                "C3 calibration requires at least one RSI sell level."
            );

        }


        return {

            rsiBuyLevels,

            rsiSellLevels

        };

    }


    // ========================================================
    // NORMALIZE NUMBER ARRAY
    // ========================================================

    static normalizeNumberArray(
        values
    ) {

        if (
            !Array.isArray(values)
        ) {

            return [];

        }


        return [
            ...new Set(

                values
                    .map(
                        value =>
                            Number(value)
                    )
                    .filter(
                        value =>
                            Number.isFinite(value)
                    )

            )
        ];

    }


    // ========================================================
    // CREATE STRATEGY OVERRIDE
    // ========================================================

    static createStrategyOverride(
        parameters
    ) {

        /*
         * IMPORTANT:
         *
         * Spread the existing nested strategy settings first.
         * Only the parameters under test are replaced.
         *
         * This means:
         *
         * EMA remains unchanged.
         * MACD remains unchanged.
         * Volume remains unchanged.
         * Signal mode remains unchanged.
         * Timeframe remains controlled by CalibrationEngine.
         */

        return {

            ...strategySettings,

            rsi: {

                ...(strategySettings.rsi || {}),

                buyLevel:
                    parameters.rsiBuyLevel,

                sellLevel:
                    parameters.rsiSellLevel

            },

            ema: {

                ...(strategySettings.ema || {})

            },

            macd: {

                ...(strategySettings.macd || {})

            },

            volume: {

                ...(strategySettings.volume || {})

            }

        };

    }


    // ========================================================
    // RUN DEFAULT RSI SEARCH
    // ========================================================

    static async runDefault(
        options = {}
    ) {

        return this.run({

            ...options,

            search: {

                ...this.DEFAULT_SEARCH,

                ...(options.search || {})

            }

        });

    }


    // ========================================================
    // GET DEFAULT SEARCH
    // ========================================================

    static getDefaultSearch() {

        return {

            rsiBuyLevels: [
                ...this.DEFAULT_SEARCH.rsiBuyLevels
            ],

            rsiSellLevels: [
                ...this.DEFAULT_SEARCH.rsiSellLevels
            ]

        };

    }

}