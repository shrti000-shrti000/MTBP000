import PostgresAdapter from "../database/PostgresAdapter.js";


class PositionRepository {


    constructor() {

        this.table = "positions";

    }



    // =====================================
    // CREATE
    // =====================================

    async create(position) {

        return await PostgresAdapter.insert(
            this.table,
            position
        );

    }



    // =====================================
    // GET ALL
    // =====================================

    async findAll() {

        return await PostgresAdapter.findAll(
            this.table
        );

    }



    // =====================================
    // GET BY ID
    // =====================================

    async findById(id) {

        return await PostgresAdapter.findById(
            this.table,
            id
        );

    }



    // =====================================
    // UPDATE
    // =====================================

    async update(
        id,
        data
    ) {

        return await PostgresAdapter.update(
            this.table,
            id,
            data
        );

    }



    // =====================================
    // DELETE
    // =====================================

    async remove(id) {

        return await PostgresAdapter.remove(
            this.table,
            id
        );

    }



    // =====================================
    // OPEN POSITIONS
    // =====================================

    async findOpen() {

        const positions =
            await PostgresAdapter.findAll(
                this.table
            );


        return positions.filter(
            position =>
                position.status === "OPEN"
        );

    }



    // =====================================
    // CLOSED POSITIONS
    // =====================================

    async findClosed() {

        const positions =
            await PostgresAdapter.findAll(
                this.table
            );


        return positions.filter(
            position =>
                position.status === "CLOSED"
        );

    }




    // =====================================
// LOAD OPEN POSITIONS
// =====================================

async loadOpenPositions() {

    return await this.findOpen();

}


}


export default new PositionRepository();