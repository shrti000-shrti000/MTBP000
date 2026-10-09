// ======================================================
// MTBP STORAGE MANAGER
//
// Central storage controller.
//
// Future adapters:
// PostgreSQL
// SQLite
// Redis
// File
//
// ======================================================


//import MemoryAdapter from "./adapters/MemoryAdapter.js";


import PostgresStorageAdapter from "./database/PostgresStorageAdapter.js";



class StorageManager {


    constructor() {


        this.adapter =
           // MemoryAdapter;


           PostgresStorageAdapter


        this.ready =
            false;


    }



    // ==========================================
    // INITIALIZE STORAGE
    // ==========================================

    async init() {


        await this.adapter.connect();


        this.ready =
            true;


       // console.log(
      //      "🟢 STORAGE MANAGER READY"
      //  );


    }



    // ==========================================
    // SAVE
    // ==========================================

    async save(
        key,
        data
    ) {


        if (!this.ready) {

            await this.init();

        }


        return this.adapter.save(
            key,
            data
        );


    }



    // ==========================================
    // LOAD
    // ==========================================

    async load(
        key
    ) {


        if (!this.ready) {

            await this.init();

        }


        return this.adapter.load(
            key
        );


    }



    // ==========================================
    // REMOVE
    // ==========================================

    async remove(
        key
    ) {


        return this.adapter.remove(
            key
        );


    }



    // ==========================================
    // CLEAR
    // ==========================================

    async clear() {


        return this.adapter.clear();


    }



    // ==========================================
    // CHANGE STORAGE ENGINE
    // Future
    // ==========================================

    setAdapter(
        adapter
    ) {


        this.adapter =
            adapter;


    }



}



export default new StorageManager();