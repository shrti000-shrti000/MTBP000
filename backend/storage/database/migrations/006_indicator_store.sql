CREATE TABLE IF NOT EXISTS indicator_store (

    exchange VARCHAR(50) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    timeframe VARCHAR(20) NOT NULL,

    indicator VARCHAR(50) NOT NULL,

    value JSONB,

    updated_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY
    (
        exchange,
        symbol,
        timeframe,
        indicator
    )

);