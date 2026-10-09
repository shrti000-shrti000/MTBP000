import CalibrationEngine from "./calibration/CalibrationEngine.js";

const SETTINGS_API_URL =
    process.env.MTBP_SETTINGS_URL ||
    "http://localhost:3000/api/strategy/settings";

const CANDLE_LIMIT = 470;

const EMA_TESTS = [
    { fast: 5, slow: 20 },
    { fast: 5, slow: 30 },
    { fast: 5, slow: 50 },
    { fast: 9, slow: 20 },
    { fast: 9, slow: 30 },
    { fast: 9, slow: 50 },
    { fast: 11, slow: 30 },
    { fast: 11, slow: 50 },
    { fast: 11, slow: 75 },
    { fast: 15, slow: 30 },
    { fast: 15, slow: 50 },
    { fast: 15, slow: 75 },
    { fast: 20, slow: 50 },
    { fast: 20, slow: 75 },
    { fast: 20, slow: 100 }
];

async function loadActiveStrategySettings() {
    let response;

    try {
        response = await fetch(SETTINGS_API_URL);
    } catch (error) {
        throw new Error(
            `Could not connect to the live strategy settings API at ${SETTINGS_API_URL}. ` +
            "Start the backend and confirm the API is reachable. No config-file fallback is used."
        );
    }

    if (!response.ok) {
        throw new Error(
            `Strategy settings API returned HTTP ${response.status}. ` +
            "Calibration stopped; no config-file fallback is used."
        );
    }

    let settings;

    try {
        settings = await response.json();
    } catch {
        throw new Error(
            "Strategy settings API did not return valid JSON. Calibration stopped."
        );
    }

    if (
        !settings ||
        typeof settings !== "object" ||
        !settings.ema ||
        !Number.isFinite(Number(settings.ema.fast)) ||
        !Number.isFinite(Number(settings.ema.slow)) ||
        !settings.rsi ||
        !settings.macd ||
        !settings.exchange ||
        !settings.symbol ||
        !settings.timeframe
    ) {
        throw new Error(
            "The API response is missing required strategy settings (exchange, symbol, timeframe, RSI, EMA, or MACD). " +
            "Calibration stopped rather than using stale defaults."
        );
    }

    return settings;
}

function format(value, digits = 4) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : "N/A";
}

async function runTest(activeSettings, ema) {
    const settingsOverride = {
        ...activeSettings,
        exchange: activeSettings.exchange,
        symbol: activeSettings.symbol,
        timeframe: activeSettings.timeframe,
        rsi: {
            ...activeSettings.rsi,
            buyLevel: 35,
            sellLevel: 65
        },
        ema: {
            ...activeSettings.ema,
            fast: ema.fast,
            slow: ema.slow
        },
        macd: {
            ...activeSettings.macd,
            fast: 15,
            slow: 30,
            signal: 5
        }
    };

    const result = await CalibrationEngine.run({
        exchange: String(activeSettings.exchange).toUpperCase(),
        symbol: activeSettings.symbol,
        timeframe: activeSettings.timeframe,
        candleLimit: CANDLE_LIMIT,
        strategySettingsOverride: settingsOverride
    });

    if (!result || result.success !== true || !result.metrics) {
        throw new Error(
            "CalibrationEngine.run() returned no valid metrics object. " +
            "Expected result.metrics; check the calibration engine response."
        );
    }

    const metrics = result.metrics;

    return {
        Fast: ema.fast,
        Slow: ema.slow,
        NetProfit: metrics.netProfit,
        PF: metrics.profitFactor,
        WinRate: metrics.winRate,
        Trades: metrics.tradeCount,
        Expectancy: metrics.expectancy,
        MaxDD: metrics.maxDrawdown,
        Long: metrics.longTrades,
        LongWin: metrics.longWinRate,
        Short: metrics.shortTrades,
        ShortWin: metrics.shortWinRate,
        Fees: metrics.totalFees
    };
}

async function main() {
    const activeSettings = await loadActiveStrategySettings();

    console.log("\n=== ACTIVE SETTINGS FROM BACKEND API ===");
    console.log(`API:       ${SETTINGS_API_URL}`);
    console.log(`Exchange:  ${activeSettings.exchange}`);
    console.log(`Symbol:    ${activeSettings.symbol}`);
    console.log(`Timeframe: ${activeSettings.timeframe}`);
    console.log(`EMA base:  ${activeSettings.ema.fast}/${activeSettings.ema.slow}`);
    console.log(
        `RSI:       ${activeSettings.rsi.buyLevel ?? "API value"}/${activeSettings.rsi.sellLevel ?? "API value"} (test uses 35/65)`
    );
    console.log("MACD test: 15/30/5");
    console.log(`Candles:   ${CANDLE_LIMIT}`);
    console.log("Live strategy settings will not be changed.\n");

    const results = [];

    for (const ema of EMA_TESTS) {
        process.stdout.write(`Testing EMA ${ema.fast}/${ema.slow} ... `);

        try {
            const row = await runTest(activeSettings, ema);
            results.push(row);
            console.log(
                `done | Net ${format(row.NetProfit)} | PF ${format(row.PF)} | Trades ${row.Trades}`
            );
        } catch (error) {
            console.error("\nCalibration test failed. Stopping to avoid incomplete comparison.");
            console.error(error?.stack || error);
            process.exitCode = 1;
            return;
        }
    }

    const baseline = results.find(
        row =>
            row.Fast === Number(activeSettings.ema.fast) &&
            row.Slow === Number(activeSettings.ema.slow)
    );

    console.log("\n=== EMA CALIBRATION RESULTS ===");
    console.log(
        "EMA       NetProfit  PF      WinRate  Trades  Expectancy  MaxDD    Long  LongWin  Short  ShortWin  Fees"
    );

    for (const row of results) {
        const isBaseline =
            row.Fast === Number(activeSettings.ema.fast) &&
            row.Slow === Number(activeSettings.ema.slow);

        console.log(
            `${String(row.Fast).padStart(2)}/${String(row.Slow).padEnd(3)}${isBaseline ? " *" : "  "}  ` +
            `${format(row.NetProfit).padStart(9)}  ` +
            `${format(row.PF).padStart(6)}  ` +
            `${format(row.WinRate, 2).padStart(7)}  ` +
            `${String(row.Trades).padStart(6)}  ` +
            `${format(row.Expectancy).padStart(10)}  ` +
            `${format(row.MaxDD).padStart(7)}  ` +
            `${String(row.Long).padStart(4)}  ` +
            `${format(row.LongWin, 2).padStart(7)}  ` +
            `${String(row.Short).padStart(5)}  ` +
            `${format(row.ShortWin, 2).padStart(8)}  ` +
            `${format(row.Fees).padStart(7)}`
        );
    }

    if (baseline) {
        console.log(
            `\n* Baseline from the live API: EMA ${baseline.Fast}/${baseline.Slow}.`
        );
    } else {
        console.log(
            `\nWARNING: Live API baseline EMA ${activeSettings.ema.fast}/${activeSettings.ema.slow} ` +
            "is not in the 15-combination test list, so no baseline row is marked."
        );
    }

    console.log(
        "\nImportant: this is a historical simulation on a limited candle window, not proof of future profitability."
    );
}

main().catch(error => {
    console.error("\nCalibration test could not start:");
    console.error(error?.stack || error);
    process.exitCode = 1;
});
