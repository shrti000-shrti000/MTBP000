import PostgresAdapter from "../database/PostgresAdapter.js";

// ======================================================
// MTBP — Trade Diagnostic Repository
// ذخیره و بازیابی اطلاعات تشخیصی معاملات
// ======================================================

const TABLES = {
    diagnostics: "trade_diagnostics",
    events: "trade_diagnostic_events"
};

const SYSTEM_FIELDS = {
    trade_diagnostics: new Set(["id", "created_at", "updated_at"]),
    trade_diagnostic_events: new Set(["id", "created_at"])
};

const fieldCache = new Map();

async function getAllowedFields(tableName) {
    if (!Object.values(TABLES).includes(tableName)) {
        throw new Error(`TradeDiagnosticRepository: unsupported table "${tableName}"`);
    }

    if (!fieldCache.has(tableName)) {
        const result = await PostgresAdapter.query(
            `SELECT column_name
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1`,
            [tableName]
        );

        const fields = new Set(
            (result.rows ?? [])
                .map(row => row.column_name)
                .filter(name => !SYSTEM_FIELDS[tableName].has(name))
        );

        if (fields.size === 0) {
            throw new Error(
                `TradeDiagnosticRepository: no columns found for "${tableName}"`
            );
        }

        fieldCache.set(tableName, fields);
    }

    return fieldCache.get(tableName);
}

function validateFields(input, allowedFields, requiredFields = []) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("TradeDiagnosticRepository: input must be an object");
    }

    for (const key of Object.keys(input)) {
        if (!allowedFields.has(key)) {
            throw new Error(
                `TradeDiagnosticRepository: unsupported database field "${key}"`
            );
        }
    }

    for (const key of requiredFields) {
        if (input[key] === undefined || input[key] === null || input[key] === "") {
            throw new Error(
                `TradeDiagnosticRepository: required field "${key}" is missing`
            );
        }
    }
}

function quoteIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
}

function toDatabaseValue(value) {
    return value !== null && typeof value === "object"
        ? JSON.stringify(value)
        : value;
}

class TradeDiagnosticRepository {
    constructor() {
        this.diagnosticsTable = TABLES.diagnostics;
        this.eventsTable = TABLES.events;
    }

    // ==================================================
    // ذخیره یا به‌روزرسانی گزارش تشخیصی یک پوزیشن
    // فیلدهای مجاز از ساختار واقعی دیتابیس خوانده می‌شوند.
    // ==================================================

    async upsertDiagnostic(diagnostic) {
        const allowedFields = await getAllowedFields(this.diagnosticsTable);
        validateFields(diagnostic, allowedFields, ["position_id"]);

        const entries = Object.entries(diagnostic)
            .filter(([, value]) => value !== undefined);

        const columns = entries.map(([key]) => quoteIdentifier(key));
        const values = entries.map(([, value]) => toDatabaseValue(value));
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const updates = entries
            .filter(([key]) => key !== "position_id")
            .map(([key]) => {
                const column = quoteIdentifier(key);
                return `${column} = EXCLUDED.${column}`;
            });

        const updateClause = updates.length
            ? updates.join(", ") + ", " + `${quoteIdentifier("updated_at")} = NOW()`
            : `${quoteIdentifier("position_id")} = EXCLUDED.${quoteIdentifier("position_id")}`;

        const sql = `
            INSERT INTO ${quoteIdentifier(this.diagnosticsTable)}
                (${columns.join(", ")})
            VALUES (${placeholders.join(", ")})
            ON CONFLICT (${quoteIdentifier("position_id")})
            DO UPDATE SET ${updateClause}
            RETURNING *
        `;

        const result = await PostgresAdapter.query(sql, values);
        return result.rows?.[0] ?? null;
    }

    // ==================================================
    // دریافت گزارش یک پوزیشن
    // ==================================================

    async findDiagnosticByPositionId(positionId) {
        if (!positionId) {
            throw new Error("positionId is required");
        }

        const result = await PostgresAdapter.query(
            `
                SELECT *
                FROM ${quoteIdentifier(this.diagnosticsTable)}
                WHERE position_id = $1
                LIMIT 1
            `,
            [positionId]
        );

        return result.rows?.[0] ?? null;
    }

    // ==================================================
    // جست‌وجوی گزارش‌ها با فیلترهای اختیاری
    // ==================================================

    async findDiagnostics({
        exchange = null,
        symbol = null,
        mode = null,
        side = null,
        dataQuality = null,
        limit = 100,
        offset = 0
    } = {}) {
        const safeLimit = Math.max(
            1,
            Math.min(1000, Math.trunc(Number(limit) || 100))
        );
        const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0));
        const conditions = [];
        const values = [];

        const addCondition = (column, value) => {
            if (value === null || value === undefined || value === "") return;
            values.push(value);
            conditions.push(`${quoteIdentifier(column)} = $${values.length}`);
        };

        addCondition("exchange", exchange);
        addCondition("symbol", symbol);
        addCondition("mode", mode);
        addCondition("side", side);
        addCondition("data_quality", dataQuality);

        values.push(safeLimit);
        const limitParameter = `$${values.length}`;
        values.push(safeOffset);
        const offsetParameter = `$${values.length}`;
        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const result = await PostgresAdapter.query(
            `
                SELECT *
                FROM ${quoteIdentifier(this.diagnosticsTable)}
                ${whereClause}
                ORDER BY entry_time DESC NULLS LAST, created_at DESC NULLS LAST
                LIMIT ${limitParameter}
                OFFSET ${offsetParameter}
            `,
            values
        );

        return result.rows ?? [];
    }

    // ==================================================
    // ثبت یک رویداد تشخیصی
    // ==================================================

    async addEvent(event) {
        const allowedFields = await getAllowedFields(this.eventsTable);
        validateFields(event, allowedFields, ["position_id", "event_type"]);

        const entries = Object.entries(event)
            .filter(([, value]) => value !== undefined);
        const columns = entries.map(([key]) => quoteIdentifier(key));
        const values = entries.map(([, value]) => toDatabaseValue(value));
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const result = await PostgresAdapter.query(
            `
                INSERT INTO ${quoteIdentifier(this.eventsTable)}
                    (${columns.join(", ")})
                VALUES (${placeholders.join(", ")})
                RETURNING *
            `,
            values
        );

        return result.rows?.[0] ?? null;
    }

    // ==================================================
    // دریافت تاریخچه رویدادهای یک پوزیشن (قدیمی به جدید)
    // ==================================================

    async findEventsByPositionId(positionId, limit = 1000) {
        if (!positionId) {
            throw new Error("positionId is required");
        }

        const safeLimit = Math.max(
            1,
            Math.min(5000, Math.trunc(Number(limit) || 1000))
        );

        const result = await PostgresAdapter.query(
            `
                SELECT *
                FROM ${quoteIdentifier(this.eventsTable)}
                WHERE position_id = $1
                ORDER BY event_at ASC NULLS LAST, id ASC
                LIMIT $2
            `,
            [positionId, safeLimit]
        );

        return result.rows ?? [];
    }

    // ==================================================
    // گزارش‌های فاقد داده یا دارای کیفیت نامشخص
    // ==================================================

    async findIncompleteDiagnostics(limit = 100) {
        const safeLimit = Math.max(
            1,
            Math.min(1000, Math.trunc(Number(limit) || 100))
        );

        const result = await PostgresAdapter.query(
            `
                SELECT *
                FROM ${quoteIdentifier(this.diagnosticsTable)}
                WHERE data_quality IS NULL
                   OR data_quality <> 'COMPLETE'
                   OR jsonb_array_length(COALESCE(missing_fields, '[]'::jsonb)) > 0
                ORDER BY created_at DESC NULLS LAST
                LIMIT $1
            `,
            [safeLimit]
        );

        return result.rows ?? [];
    }

    // ==================================================
    // آمار پوشش گزارش‌های تشخیصی
    // نام فیلدهای خروجی نسخه کامپیوتر حفظ شده است.
    // ==================================================

    async getCoverageSummary() {
        const result = await PostgresAdapter.query(
            `
                SELECT
                    COUNT(*)::integer AS total_diagnostics,
                    COUNT(*) FILTER (
                        WHERE data_quality = 'COMPLETE'
                    )::integer AS complete_diagnostics,
                    COUNT(*) FILTER (
                        WHERE data_quality IS DISTINCT FROM 'COMPLETE'
                    )::integer AS incomplete_diagnostics,
                    COUNT(*) FILTER (
                        WHERE signal_candle IS NULL
                    )::integer AS missing_signal_candle,
                    COUNT(*) FILTER (
                        WHERE entry_candle IS NULL
                    )::integer AS missing_entry_candle,
                    COUNT(*) FILTER (
                        WHERE exit_candle IS NULL
                    )::integer AS missing_exit_candle
                FROM ${quoteIdentifier(this.diagnosticsTable)}
            `
        );

        return result.rows?.[0] ?? null;
    }
}

export default new TradeDiagnosticRepository();
