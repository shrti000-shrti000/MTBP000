import db from "./Database.js";


// کد کاملا اصلاحی 


// ======================================================
// POSTGRES ADAPTER
// ======================================================

class PostgresAdapter {


    // ==================================================
    // QUOTE IDENTIFIER
    //
    // برای جلوگیری از مشکل نام ستون‌هایی که
    // PostgreSQL به عنوان keyword می‌شناسد.
    //
    // مثال:
    //
    // trailing
    //
    // تبدیل می‌شود به:
    //
    // "trailing"
    // ==================================================

    quoteIdentifier(identifier) {

        if (
            typeof identifier !== "string" ||
            !identifier.trim()
        ) {

            throw new Error(
                "Invalid SQL identifier"
            );

        }


        return `"${identifier.replace(
            /"/g,
            '""'
        )}"`;

    }


    // ==================================================
    // RAW QUERY
    // ==================================================

    async query(
        text,
        params = []
    ) {

        return await db.query(
            text,
            params
        );

    }


    // ==================================================
    // INSERT
    // ==================================================

    async insert(
        table,
        data
    ) {

        if (
            !table ||
            !data ||
            typeof data !== "object"
        ) {

            throw new Error(
                "Invalid INSERT data"
            );

        }


        const keys =
            Object.keys(data);


        if (keys.length === 0) {

            throw new Error(
                "INSERT data is empty"
            );

        }


        const values =
            Object.values(data);


        // ----------------------------------------------
        // QUOTED COLUMNS
        // ----------------------------------------------

        const columns =
            keys
                .map(key =>
                    this.quoteIdentifier(key)
                )
                .join(",");


        // ----------------------------------------------
        // PARAMETERS
        // ----------------------------------------------

        const params =
            keys
                .map(
                    (_, index) =>
                        `$${index + 1}`
                )
                .join(",");


        // ----------------------------------------------
        // QUERY
        // ----------------------------------------------

        const query = `
            INSERT INTO ${this.quoteIdentifier(table)}
            (${columns})
            VALUES (${params})
            RETURNING *
        `;


        const result =
            await db.query(
                query,
                values
            );


        return (
            result.rows[0] ??
            null
        );

    }


    // ==================================================
    // FIND ALL
    // ==================================================

    async findAll(
        table
    ) {

        const query = `
            SELECT *
            FROM ${this.quoteIdentifier(table)}
        `;


        const result =
            await db.query(
                query
            );


        return result.rows;

    }


    // ==================================================
    // FIND BY ID
    // ==================================================

    async findById(
        table,
        id
    ) {

        const query = `
            SELECT *
            FROM ${this.quoteIdentifier(table)}
            WHERE "id"=$1
        `;


        const result =
            await db.query(
                query,
                [id]
            );


        return (
            result.rows[0] ??
            null
        );

    }


    // ==================================================
    // UPDATE
    // ==================================================

    async update(
        table,
        id,
        data
    ) {

        if (
            !table ||
            !data ||
            typeof data !== "object"
        ) {

            throw new Error(
                "Invalid UPDATE data"
            );

        }


        const keys =
            Object.keys(data);


        if (keys.length === 0) {

            return this.findById(
                table,
                id
            );

        }


        const values =
            Object.values(data);


        // ----------------------------------------------
        // SET CLAUSE
        // ----------------------------------------------

        const sets =
            keys
                .map(
                    (key, index) =>
                        `${this.quoteIdentifier(key)}=$${index + 1}`
                )
                .join(",");


        // ----------------------------------------------
        // ID PARAMETER
        // ----------------------------------------------

        values.push(id);


        const idParameter =
            `$${values.length}`;


        // ----------------------------------------------
        // QUERY
        // ----------------------------------------------

        const query = `
            UPDATE ${this.quoteIdentifier(table)}
            SET
                ${sets},
                "updated_at"=NOW()
            WHERE "id"=${idParameter}
            RETURNING *
        `;


        const result =
            await db.query(
                query,
                values
            );


        return (
            result.rows[0] ??
            null
        );

    }


    // ==================================================
    // DELETE
    // ==================================================

    async remove(
        table,
        id
    ) {

        const query = `
            DELETE FROM ${this.quoteIdentifier(table)}
            WHERE "id"=$1
        `;


        await db.query(
            query,
            [id]
        );


        return true;

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new PostgresAdapter();