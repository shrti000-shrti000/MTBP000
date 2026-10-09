const strategySettings = {

    exchange: "toobit",

    symbol: "BTCUSDT",

    timeframe: "15m",

    signalMode: "balanced",

    rsi: {

        enabled: true,

        period: 14,
        

        buyLevel: 30,

        sellLevel: 70,

        weight: 35,

    },

    ema: {

        enabled: true,

        fast: 11,
        

        slow: 50,

        

        weight: 30,

    },

    macd: {

        enabled: true,

        fast: 12,
        
        slow: 26,
        

        signal: 9,
        

        weight: 20,

    },

    volume: {

    enabled: true,

    weight: 15,

    period: 20,

    multiplier: 1.5,

    threshold: 100,

},

};

export default strategySettings;