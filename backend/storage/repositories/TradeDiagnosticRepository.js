import PostgresAdapter from "../database/PostgresAdapter.js";

const DIAGNOSTIC_FIELDS = new Set([
  "position_id", "position_code", "exchange", "symbol", "mode", "side",
  "timeframe", "strategy_name", "signal_id", "signal_time", "signal_type",
  "signal_price", "signal_confidence", "signal_score", "buy_score", "sell_score",
  "signal_details", "indicator_scores", "indicator_values", "strategy_settings",
  "risk_settings", "signal_candle", "entry_candle", "exit_candle", "entry_time",
  "entry_price", "entry_quantity", "entry_order_id", "entry_fills",
  "initial_stop_loss", "current_stop_loss", "take_profit", "trailing_settings",
  "stop_history", "exit_time", "exit_price", "exit_quantity", "exit_order_id",
  "exit_reason", "exit_fills", "highest_price", "lowest_price", "mfe", "mae",
  "gross_pnl", "fees", "funding_fees", "net_pnl", "expected_risk", "realized_r",
  "data_quality", "missing_fields", "source_snapshot"
]);

const EVENT_FIELDS = new Set([
  "position_id", "event_at", "event_type", "source", "exchange", "symbol",
  "order_id", "price", "quantity", "old_values", "new_values", "event_details",
  "data_quality"
]);

function validateFields(input, allowedFields, requiredFields = []) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Input must be an object.");
  }
  const keys = Object.keys(input);
  for (const key of keys) {
    if (!allowedFields.has(key)) {
      throw new Error(`Unsupported database field: ${key}`);
    }
  }
  for (const key of requiredFields) {
    if (input[key] === undefined || input[key] === null || input[key] === "") {
      throw new Error(`Required field is missing: ${key}`);
    }
  }
}

export default class TradeDiagnosticRepository {
  static async upsertDiagnostic(diagnostic) {
    validateFields(diagnostic, DIAGNOSTIC_FIELDS, ["position_id"]);
    const entries = Object.entries(diagnostic);
    const columns = entries.map(([key]) => `"${key}"`);
    const placeholders = entries.map((_, index) => `$${index + 1}`);
    const updates = entries
      .filter(([key]) => key !== "position_id")
      .map(([key]) => `"${key}" = EXCLUDED."${key}"`);

    const sql = `
      INSERT INTO trade_diagnostics (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      ON CONFLICT (position_id) DO UPDATE SET
        ${updates.length ? updates.join(", ") + ", " : ""}updated_at = NOW()
      RETURNING *
    `;
    const values = entries.map(([, value]) =>
      value !== null && typeof value === "object" ? JSON.stringify(value) : value
    );
    const result = await PostgresAdapter.query(sql, values);
    return result.rows?.[0] ?? null;
  }

  static async findDiagnosticByPositionId(positionId) {
    if (!positionId) throw new TypeError("positionId is required.");
    const result = await PostgresAdapter.query(
      "SELECT * FROM trade_diagnostics WHERE position_id = $1 LIMIT 1",
      [positionId]
    );
    return result.rows?.[0] ?? null;
  }

  static async findDiagnostics({
    exchange, symbol, mode, side, dataQuality, limit = 100, offset = 0
  } = {}) {
    const filters = [];
    const values = [];
    const addFilter = (column, value) => {
      if (value !== undefined && value !== null && value !== "") {
        values.push(value);
        filters.push(`${column} = $${values.length}`);
      }
    };
    addFilter("exchange", exchange);
    addFilter("symbol", symbol);
    addFilter("mode", mode);
    addFilter("side", side);
    addFilter("data_quality", dataQuality);

    const safeLimit = Math.max(1, Math.min(1000, Number.parseInt(limit, 10) || 100));
    const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
    values.push(safeLimit, safeOffset);
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await PostgresAdapter.query(
      `SELECT * FROM trade_diagnostics ${where}
       ORDER BY entry_time DESC NULLS LAST, created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return result.rows ?? [];
  }

  static async addEvent(event) {
    validateFields(event, EVENT_FIELDS, ["position_id", "event_type"]);
    const entries = Object.entries(event);
    const columns = entries.map(([key]) => `"${key}"`);
    const placeholders = entries.map((_, index) => `$${index + 1}`);
    const values = entries.map(([, value]) =>
      value !== null && typeof value === "object" ? JSON.stringify(value) : value
    );
    const result = await PostgresAdapter.query(
      `INSERT INTO trade_diagnostic_events (${columns.join(", ")})
       VALUES (${placeholders.join(", ")}) RETURNING *`,
      values
    );
    return result.rows?.[0] ?? null;
  }

  static async findEventsByPositionId(positionId, limit = 500) {
    if (!positionId) throw new TypeError("positionId is required.");
    const safeLimit = Math.max(1, Math.min(5000, Number.parseInt(limit, 10) || 500));
    const result = await PostgresAdapter.query(
      `SELECT * FROM trade_diagnostic_events
       WHERE position_id = $1 ORDER BY event_at DESC, id DESC LIMIT $2`,
      [positionId, safeLimit]
    );
    return result.rows ?? [];
  }

  static async findIncompleteDiagnostics(limit = 100) {
    const safeLimit = Math.max(1, Math.min(1000, Number.parseInt(limit, 10) || 100));
    const result = await PostgresAdapter.query(
      `SELECT * FROM trade_diagnostics
       WHERE data_quality <> 'COMPLETE'
          OR jsonb_array_length(COALESCE(missing_fields, '[]'::jsonb)) > 0
       ORDER BY created_at DESC LIMIT $1`,
      [safeLimit]
    );
    return result.rows ?? [];
  }

  static async getCoverageSummary() {
    const result = await PostgresAdapter.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE data_quality = 'COMPLETE')::int AS complete,
        COUNT(*) FILTER (WHERE data_quality <> 'COMPLETE')::int AS incomplete,
        COUNT(*) FILTER (WHERE signal_candle IS NULL)::int AS missing_signal_candle,
        COUNT(*) FILTER (WHERE entry_candle IS NULL)::int AS missing_entry_candle,
        COUNT(*) FILTER (WHERE exit_candle IS NULL)::int AS missing_exit_candle
      FROM trade_diagnostics
    `);
    return result.rows?.[0] ?? {
      total: 0, complete: 0, incomplete: 0,
      missing_signal_candle: 0, missing_entry_candle: 0, missing_exit_candle: 0
    };
  }
}
