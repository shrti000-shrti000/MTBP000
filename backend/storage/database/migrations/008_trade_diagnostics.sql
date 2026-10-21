BEGIN;

CREATE TABLE IF NOT EXISTS trade_diagnostics (
    id BIGSERIAL PRIMARY KEY,
    position_id UUID NOT NULL UNIQUE REFERENCES positions(id) ON DELETE CASCADE,
    position_code TEXT,
    exchange TEXT,
    symbol TEXT,
    mode TEXT,
    side TEXT,
    timeframe TEXT,
    strategy_name TEXT,
    signal_id TEXT,
    signal_time TIMESTAMPTZ,
    signal_type TEXT,
    signal_price NUMERIC,
    signal_confidence NUMERIC,
    signal_score NUMERIC,
    buy_score NUMERIC,
    sell_score NUMERIC,
    signal_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    indicator_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    indicator_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    strategy_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    signal_candle JSONB,
    entry_candle JSONB,
    exit_candle JSONB,
    entry_time TIMESTAMPTZ,
    entry_price NUMERIC,
    entry_quantity NUMERIC,
    entry_order_id TEXT,
    entry_fills JSONB NOT NULL DEFAULT '[]'::jsonb,
    initial_stop_loss NUMERIC,
    current_stop_loss NUMERIC,
    take_profit NUMERIC,
    trailing_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    stop_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    exit_time TIMESTAMPTZ,
    exit_price NUMERIC,
    exit_quantity NUMERIC,
    exit_order_id TEXT,
    exit_reason TEXT,
    exit_fills JSONB NOT NULL DEFAULT '[]'::jsonb,
    highest_price NUMERIC,
    lowest_price NUMERIC,
    mfe NUMERIC,
    mae NUMERIC,
    gross_pnl NUMERIC,
    fees NUMERIC,
    funding_fees NUMERIC,
    net_pnl NUMERIC,
    expected_risk NUMERIC,
    realized_r NUMERIC,
    data_quality TEXT NOT NULL DEFAULT 'INCOMPLETE',
    missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_diagnostics_symbol_entry_time
    ON trade_diagnostics (symbol, entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trade_diagnostics_exchange_mode
    ON trade_diagnostics (exchange, mode);
CREATE INDEX IF NOT EXISTS idx_trade_diagnostics_data_quality
    ON trade_diagnostics (data_quality);
CREATE INDEX IF NOT EXISTS idx_trade_diagnostics_exit_reason
    ON trade_diagnostics (exit_reason);
CREATE INDEX IF NOT EXISTS idx_trade_diagnostics_signal_time
    ON trade_diagnostics (signal_time DESC);

CREATE TABLE IF NOT EXISTS trade_diagnostic_events (
    id BIGSERIAL PRIMARY KEY,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type TEXT NOT NULL,
    source TEXT,
    exchange TEXT,
    symbol TEXT,
    order_id TEXT,
    price NUMERIC,
    quantity NUMERIC,
    old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_quality TEXT NOT NULL DEFAULT 'RECORDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_diagnostic_events_position_time
    ON trade_diagnostic_events (position_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_diagnostic_events_type_time
    ON trade_diagnostic_events (event_type, event_at DESC);

COMMIT;
