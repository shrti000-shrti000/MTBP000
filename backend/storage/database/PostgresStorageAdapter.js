// ======================================================
// MTBP POSTGRES STORAGE ADAPTER
//
// Key / Value persistent storage
//
// Replaces MemoryAdapter
//
// ======================================================

import db from "./Database.js";


class PostgresStorageAdapter {


    async connect() {

        await db.test();

    }



    async save(
        key,
        data
    ) {


        await db.query(
            `
            INSERT INTO system_storage
            (
                key,
                data,
                updated_at
            )

            VALUES
            (
                $1,
                $2,
                NOW()
            )

            ON CONFLICT (key)

            DO UPDATE SET

            data = EXCLUDED.data,

            updated_at = NOW()

            `,
            [
    key,
    data
]
        );


    }



    async load(
        key
    ) {


        const result =
            await db.query(
                `
                SELECT data

                FROM system_storage

                WHERE key=$1

                `,
                [
                    key
                ]
            );


        if (!result.rows.length) {

            return null;

        }


        return result.rows[0].data;


    }



    async remove(
        key
    ) {


        await db.query(
            `
            DELETE FROM system_storage

            WHERE key=$1

            `,
            [
                key
            ]
        );


    }



    async clear() {


        await db.query(
            `
            DELETE FROM system_storage
            `
        );


    }


}


export default new PostgresStorageAdapter();