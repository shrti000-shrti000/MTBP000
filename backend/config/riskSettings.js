const riskSettings = {

    // ================= ACCOUNT =================

    account: {

        exchange: "TOOBIT",

        symbol: "BTCUSDT",

        balance: 0,

        availableBalance: 0,

        equity: 0,

        pnl: 0,

        leverageEnabled: false,

        leverage: 1,

        marginType: "ISOLATED",

        maxLeverage: 10,

    },


    // ================= POSITION =================

    positionMode: "AUTO",

    positionSizePercent: 10,

    fixedLot: 0.01,

    maxPositionSize: 100,

    minimumOrderSize: 10,

    useBalancePercent: true,

    maxLossPerTrade: 2,

    tradeDirection: "BOTH",

    leverage: 1,

    maxPortfolioRisk: 9,

    // Estimated taker fee per side; align with calibration fee assumptions.
    // Update to the actual account fee tier before relying on Paper PnL.
    tradingFeeRate: 0.0006,


    // ================= RISK =================

    riskPerTrade: 1,

    minBalanceToTrade: 5,


    // ================= STOP LOSS =================

    stopLoss: {

        enabled: true,

        // PERCENT | FIXED | ATR
        mode: "ATR",

        // SL % - inactive in ATR mode
        value: 0,

        price: 0,

        atrPeriod: 10,

        atrMultiplier: 1.7,

    },


    // ================= TAKE PROFIT =================

    takeProfit: {

        enabled: true,

        // FIXED | RR | RISK_REWARD | TRAILING
        mode: "RISK_REWARD",

        // TP % - inactive in RISK_REWARD mode
        value: 0,

        // Active Risk/Reward ratio
        rrRatio: 1.5,

        // Fixed TP Price - inactive in RISK_REWARD mode
        price: 0,

        partialClose: false,

        partialClosePercent: 50,

    },


    // ===============================
    // TRAILING STOP
    // ===============================

    trailing: {

        enabled: true,

        // PERCENT | PRICE | ATR | CHANDELIER | VOLATILITY
        mode: "CHANDELIER",


        // =========================
        // COMMON
        // =========================

        // Inactive in CHANDELIER mode
        activationPercent: 0,

        // Inactive in CHANDELIER mode
        activationPrice: 0,

        // Inactive in CHANDELIER mode
        distance: 0,

        // Inactive in CHANDELIER mode
        step: 0,


        // =========================
        // ATR / CHANDELIER
        // =========================

        atrPeriod: 30,

        atrMultiplier: 0.5,


        // =========================
        // CHANDELIER
        // =========================

        chandelierLookback: 60,


        // =========================
        // VOLATILITY STOP
        // =========================

        volatilitySource: "CLOSE",

    },


    // ===============================
    // PROTECTION
    // ===============================

    protection: {

        pauseAfterLoss: true,

        maxDailyLoss: 5,

        maxDrawdown: 10,

        maxOpenPositions: 10,

        cooldownMinutes: 30,

        stopAfterLosses: 5,

        tradingSessionLimit: 24,

    },

};

export default riskSettings;