CREATE TABLE IF NOT EXISTS strategy_settings (

    exchange VARCHAR(50) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    timeframe VARCHAR(20) NOT NULL,

    signal_mode VARCHAR(20) NOT NULL DEFAULT 'balanced',

    -- =====================================
    -- RSI
    -- =====================================

    rsi_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    rsi_period INTEGER NOT NULL DEFAULT 14,

    rsi_buy_level NUMERIC NOT NULL DEFAULT 30,

    rsi_sell_level NUMERIC NOT NULL DEFAULT 70,

    rsi_weight NUMERIC NOT NULL DEFAULT 35,


    -- =====================================
    -- EMA
    -- =====================================

    ema_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    ema_fast INTEGER NOT NULL DEFAULT 11,

    ema_slow INTEGER NOT NULL DEFAULT 50,

    ema_weight NUMERIC NOT NULL DEFAULT 30,


    -- =====================================
    -- MACD
    -- =====================================

    macd_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    macd_fast INTEGER NOT NULL DEFAULT 12,

    macd_slow INTEGER NOT NULL DEFAULT 26,

    macd_signal INTEGER NOT NULL DEFAULT 9,

    macd_weight NUMERIC NOT NULL DEFAULT 20,


    -- =====================================
    -- VOLUME
    -- =====================================

    volume_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    volume_period INTEGER NOT NULL DEFAULT 20,

    volume_multiplier NUMERIC NOT NULL DEFAULT 1.5,

    volume_threshold NUMERIC NOT NULL DEFAULT 100,

    volume_weight NUMERIC NOT NULL DEFAULT 15,


    -- =====================================
    -- TIMESTAMPS
    -- =====================================

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),


    -- =====================================
    -- UNIQUE STRATEGY SETTINGS
    -- =====================================

    PRIMARY KEY (
        exchange,
        symbol,
        timeframe
    )

);

