// ======================================================
// MTBP MEMORY STORAGE ADAPTER
//
// Temporary RAM storage.
// Used before database connection.
//
// ======================================================


import StorageAdapter from "../StorageAdapter.js";



class MemoryAdapter extends StorageAdapter {


    constructor() {

        super();

        this.memory =
            new Map();

    }



    async connect() {

     //   console.log(
      //      "🟢 MEMORY STORAGE CONNECTED"
      //  );

    }



    async save(
        key,
        data
    ) {

        this.memory.set(
            key,
            data
        );

    }



    async load(
        key
    ) {

        return (
            this.memory.get(key)
            ??
            null
        );

    }



    async remove(
        key
    ) {

        this.memory.delete(
            key
        );

    }



    async clear() {

        this.memory.clear();

    }


}



export default new MemoryAdapter();