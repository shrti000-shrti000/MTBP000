import LiveAccountRepository
    from "./repositories/LiveAccountRepository.js";


// ======================================================
// LIVE ACCOUNT STORE
// ======================================================

class LiveAccountStore {


    constructor() {

        this.accounts = [];

        this.repository =
            LiveAccountRepository;

        this.ready =
            this.loadFromDatabase();

    }


    // ==================================================
    // LOAD FROM DATABASE
    // ==================================================

    async loadFromDatabase() {

        try {

            const rows =
                await this.repository.findAll();


            if (!Array.isArray(rows)) {

                this.accounts = [];

                return;

            }


            this.accounts =
                rows.map(row => ({

                    id:
                        row.id,

                    accountId:
                        row.account_id,

                    exchange:
                        row.exchange,

                    name:
                        row.name,

                    currency:
                        row.currency ?? "USDT",

                    balance:
                        Number(
                            row.balance ?? 0
                        ),

                    equity:
                        Number(
                            row.equity ?? 0
                        ),

                    availableBalance:
                        Number(
                            row.available_balance ?? 0
                        ),

                    usedMargin:
                        Number(
                            row.used_margin ?? 0
                        ),

                    unrealizedPnl:
                        Number(
                            row.unrealized_pnl ?? 0
                        ),

                    realizedPnl:
                        Number(
                            row.realized_pnl ?? 0
                        ),

                    totalPnl:
                        Number(
                            row.total_pnl ?? 0
                        ),

                    fees:
                        Number(
                            row.fees ?? 0
                        ),

                    fundingFees:
                        Number(
                            row.funding_fees ?? 0
                        ),

                    depositTotal:
                        Number(
                            row.deposit_total ?? 0
                        ),

                    withdrawalTotal:
                        Number(
                            row.withdrawal_total ?? 0
                        ),

                    assets:
                        row.assets ?? [],

                    status:
                        row.status ?? "ACTIVE",

                    createdAt:
                        row.created_at,

                    updatedAt:
                        row.updated_at

                }));


        }
        catch (error) {

            console.error(
                "❌ LIVE ACCOUNT DATABASE LOAD ERROR:",
                error?.message || error
            );

            this.accounts = [];

        }

    }


    // ==================================================
    // CREATE
    // ==================================================

    async create(account) {

        if (!account) {

            return null;

        }


        const exchange =
            account.exchange ?? null;


        const accountId =
            account.accountId ??
            `LIVE-${String(
                exchange ?? "UNKNOWN"
            ).toUpperCase()}`;


        const newAccount = {

            accountId,

            exchange,

            name:
                account.name ??
                "Live Account",

            currency:
                account.currency ??
                "USDT",

            balance:
                Number(
                    account.balance ?? 0
                ),

            equity:
                Number(
                    account.equity ??
                    account.balance ??
                    0
                ),

            availableBalance:
                Number(
                    account.availableBalance ??
                    account.balance ??
                    0
                ),

            usedMargin:
                Number(
                    account.usedMargin ?? 0
                ),

            unrealizedPnl:
                Number(
                    account.unrealizedPnl ?? 0
                ),

            realizedPnl:
                Number(
                    account.realizedPnl ?? 0
                ),

            totalPnl:
                Number(
                    account.totalPnl ?? 0
                ),

            fees:
                Number(
                    account.fees ?? 0
                ),

            fundingFees:
                Number(
                    account.fundingFees ?? 0
                ),

            depositTotal:
                Number(
                    account.depositTotal ?? 0
                ),

            withdrawalTotal:
                Number(
                    account.withdrawalTotal ?? 0
                ),

            assets:
                account.assets ?? [],

            status:
                account.status ??
                "ACTIVE"

        };


        const existing =
            await this.repository.findByAccountId(
                accountId
            );


        if (existing) {

            return this.getByAccountId(
                accountId
            );

        }


        const saved =
            await this.repository.create({

                account_id:
                    newAccount.accountId,

                exchange:
                    newAccount.exchange,

                name:
                    newAccount.name,

                currency:
                    newAccount.currency,

                balance:
                    newAccount.balance,

                equity:
                    newAccount.equity,

                available_balance:
                    newAccount.availableBalance,

                used_margin:
                    newAccount.usedMargin,

                unrealized_pnl:
                    newAccount.unrealizedPnl,

                realized_pnl:
                    newAccount.realizedPnl,

                total_pnl:
                    newAccount.totalPnl,

                fees:
                    newAccount.fees,

                funding_fees:
                    newAccount.fundingFees,

                deposit_total:
                    newAccount.depositTotal,

                withdrawal_total:
                    newAccount.withdrawalTotal,

                assets:
                    newAccount.assets,

                status:
                    newAccount.status

            });


        const result = {

            ...newAccount,

            id:
                saved?.id ?? null

        };


        this.accounts.push(
            result
        );


        return result;

    }


    // ==================================================
    // GET ALL
    // ==================================================

    getAll() {

        return this.accounts;

    }


    // ==================================================
    // GET BY ID
    // ==================================================

    getById(id) {

        return this.accounts.find(
            account =>
                account.id === id
        ) ?? null;

    }


    // ==================================================
    // GET BY ACCOUNT ID
    // ==================================================

    getByAccountId(accountId) {

        return this.accounts.find(
            account =>
                account.accountId === accountId
        ) ?? null;

    }


    // ==================================================
    // GET BY EXCHANGE
    // ==================================================

    getByExchange(exchange) {

        return this.accounts.find(
            account =>
                String(account.exchange)
                    .toUpperCase() ===
                String(exchange)
                    .toUpperCase()
        ) ?? null;

    }


    // ==================================================
    // UPDATE
    // ==================================================

    async update(
        id,
        data
    ) {

        const account =
            this.getById(id);


        if (!account) {

            return null;

        }


        Object.assign(
            account,
            data
        );


        const databaseData = {

            balance:
                account.balance,

            equity:
                account.equity,

            available_balance:
                account.availableBalance,

            used_margin:
                account.usedMargin,

            unrealized_pnl:
                account.unrealizedPnl,

            realized_pnl:
                account.realizedPnl,

            total_pnl:
                account.totalPnl,

            fees:
                account.fees,

            funding_fees:
                account.fundingFees,

            deposit_total:
                account.depositTotal,

            withdrawal_total:
                account.withdrawalTotal,

            assets:
                account.assets,

            status:
                account.status

        };


        await this.repository.update(
            id,
            databaseData
        );


        return account;

    }


    // ==================================================
    // GET ACCOUNT SNAPSHOT
    // ==================================================

    getSnapshot(id) {

        const account =
            this.getById(id);


        if (!account) {

            return null;

        }


        return {

            id:
                account.id,

            accountId:
                account.accountId,

            exchange:
                account.exchange,

            name:
                account.name,

            currency:
                account.currency,

            balance:
                account.balance,

            equity:
                account.equity,

            availableBalance:
                account.availableBalance,

            usedMargin:
                account.usedMargin,

            unrealizedPnl:
                account.unrealizedPnl,

            realizedPnl:
                account.realizedPnl,

            totalPnl:
                account.totalPnl,

            fees:
                account.fees,

            fundingFees:
                account.fundingFees,

            assets:
                account.assets,

            status:
                account.status

        };

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new LiveAccountStore();