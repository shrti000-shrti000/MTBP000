CREATE TABLE IF NOT EXISTS risk_state (

    id INTEGER PRIMARY KEY DEFAULT 1,

    daily_loss NUMERIC DEFAULT 0,

    current_drawdown NUMERIC DEFAULT 0,

    consecutive_losses INTEGER DEFAULT 0,

    cooldown_until TIMESTAMP,

    session_start TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT risk_state_single_row
        CHECK (id = 1)
);