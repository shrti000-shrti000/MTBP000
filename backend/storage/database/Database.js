import pg from "pg";

const { Pool } = pg;


class Database {

    constructor() {

        this.pool = null;

    }


    // ======================================
    // CREATE CONNECTION POOL
    // ======================================

    connect() {

        if (this.pool) {

            return this.pool;

        }


        this.pool = new Pool({

            host: "localhost",

            port: 5432,

            database: "mtbp",

            user: "postgres",

            password: "1234",

        });


     //   console.log(
       //     "🟢 POSTGRES CONNECTION CREATED"
       // );


        return this.pool;

    }



    // ======================================
    // QUERY
    // ======================================

    async query(
        text,
        params = []
    ) {

        const pool =
            this.connect();


        return pool.query(
            text,
            params
        );

    }



    // ======================================
    // TEST CONNECTION
    // ======================================

    async test() {

        try {

            const client =
                await this.connect()
                    .connect();


            await client.query(
                "SELECT NOW();"
            );


            client.release();


        //    console.log(
           //     "🟢 POSTGRES CONNECTED"
           // );


            return true;


        }
        catch(error) {


            console.error(
                "❌ POSTGRES ERROR:",
                error.message
            );


            return false;

        }

    }


}


export default new Database();