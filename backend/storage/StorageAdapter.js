// ======================================================
// MTBP STORAGE ADAPTER
//
// Base contract for every storage engine.
//
// Future:
// - PostgreSQL
// - SQLite
// - Redis
// - File
//
// ======================================================


class StorageAdapter {


    async connect() {

        throw new Error(
            "connect() not implemented"
        );

    }



    async save(
        key,
        data
    ) {

        throw new Error(
            "save() not implemented"
        );

    }



    async load(
        key
    ) {

        throw new Error(
            "load() not implemented"
        );

    }



    async remove(
        key
    ) {

        throw new Error(
            "remove() not implemented"
        );

    }



    async clear() {

        throw new Error(
            "clear() not implemented"
        );

    }


}



export default StorageAdapter;