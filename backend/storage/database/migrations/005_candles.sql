CREATE TABLE IF NOT EXISTS candles (

    exchange VARCHAR(50) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    timeframe VARCHAR(20) NOT NULL,

    open_time BIGINT NOT NULL,

    open NUMERIC,

    high NUMERIC,

    low NUMERIC,

    close NUMERIC,

    volume NUMERIC,

    updated_at TIMESTAMP DEFAULT NOW(),


    PRIMARY KEY
    (
        exchange,
        symbol,
        timeframe,
        open_time
    )

);