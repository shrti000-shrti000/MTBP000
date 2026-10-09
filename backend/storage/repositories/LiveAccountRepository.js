// backend/storage/repositories/LiveAccountRepository.js

import PostgresAdapter from "../database/PostgresAdapter.js";


class LiveAccountRepository {


    constructor() {

        this.table =
            "live_accounts";

    }


    // ==========================================
    // CREATE
    // ==========================================

    async create(account) {

        return await PostgresAdapter.insert(
            this.table,
            account
        );

    }


    // ==========================================
    // GET ALL
    // ==========================================

    async findAll() {

        return await PostgresAdapter.findAll(
            this.table
        );

    }


    // ==========================================
    // GET BY ID
    // ==========================================

    async findById(id) {

        return await PostgresAdapter.findById(
            this.table,
            id
        );

    }


    // ==========================================
    // GET BY ACCOUNT ID
    // ==========================================

    async findByAccountId(accountId) {

        const accounts =
            await PostgresAdapter.findAll(
                this.table
            );


        return accounts.find(
            account =>
                account.account_id === accountId
        ) ?? null;

    }


    // ==========================================
    // GET BY EXCHANGE
    // ==========================================

    async findByExchange(exchange) {

        const accounts =
            await PostgresAdapter.findAll(
                this.table
            );


        return accounts.find(
            account =>
                String(account.exchange)
                    .toUpperCase() ===
                String(exchange)
                    .toUpperCase()
        ) ?? null;

    }


    // ==========================================
    // UPDATE
    // ==========================================

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


    // ==========================================
    // DELETE
    // ==========================================

    async remove(id) {

        return await PostgresAdapter.remove(
            this.table,
            id
        );

    }

}


export default new LiveAccountRepository();