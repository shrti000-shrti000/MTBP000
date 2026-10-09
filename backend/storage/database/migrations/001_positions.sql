CREATE TABLE IF NOT EXISTS positions (

    id UUID PRIMARY KEY,

    position_code VARCHAR(50) UNIQUE NOT NULL,

    exchange VARCHAR(50),

    symbol VARCHAR(50),

    side VARCHAR(20),

    status VARCHAR(20) DEFAULT 'OPEN',


    entry_price NUMERIC,

    quantity NUMERIC,

    leverage NUMERIC DEFAULT 1,


    stop_loss NUMERIC,

    take_profit NUMERIC,


    timeframe VARCHAR(20),

    confidence NUMERIC,

    signal_id VARCHAR(100),


    opened_at TIMESTAMP DEFAULT NOW(),

    closed_at TIMESTAMP,


    exit_price NUMERIC,

    reason VARCHAR(100),


    pnl_value NUMERIC DEFAULT 0,

    pnl_percent NUMERIC DEFAULT 0,


    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);