CREATE TABLE IF NOT EXISTS signal_memory (

    exchange VARCHAR(50) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    timeframe VARCHAR(20) NOT NULL,

    signal JSONB,

    updated_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (
        exchange,
        symbol,
        timeframe
    )

);