export default {

    enabled: true,

    exchange: "toobit",

    maxCoins: 100,

    rankingMode: "combined",

    volume: {

        enabled: true,

        min24hVolume: 50000000,

    },

    liquidity: {

        enabled: true,

        maxSpread: 0.2,

    },

    volatility: {

        enabled: false,

        minChange24h: 2,

    },

    marketAge: {

        enabled: false,

        minDays: 30,

    },

};