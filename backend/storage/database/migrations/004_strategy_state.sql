CREATE TABLE IF NOT EXISTS strategy_state (

    exchange VARCHAR(50) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    timeframe VARCHAR(20) NOT NULL,

    state JSONB,

    updated_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (
        exchange,
        symbol,
        timeframe
    )

);