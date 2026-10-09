
//



// ======================================================
// MTBP
// PaperAccountStore
// ======================================================

import PaperAccountRepository
    from "./repositories/PaperAccountRepository.js";


// ======================================================
// PAPER ACCOUNT STORE
// ======================================================

class PaperAccountStore {


    constructor() {

        this.accounts = [];

        this.repository =
            PaperAccountRepository;

        // ------------------------------------------------
        // Margin Reservation Lock
        //
        // تمام عملیات رزرو / آزادسازی Margin
        // به صورت ترتیبی انجام می‌شوند.
        // ------------------------------------------------

        this.marginLock =
            Promise.resolve();

        // ------------------------------------------------
        // Pending Margin Reservations
        //
        // Margin رزرو شده تا زمانی که PositionStore
        // Position واقعی را ثبت کند، Pending باقی می‌ماند.
        //
        // key   = exchange
        // value = مجموع Marginهای Pending
        // ------------------------------------------------

        this.pendingMarginReservations =
            new Map();

        this.ready =
            this.loadFromDatabase();

    }


    // ==================================================
    // MARGIN LOCK
    // ==================================================

    async runMarginLock(callback) {

        const previous =
            this.marginLock;


        let release;


        this.marginLock =
            new Promise(resolve => {

                release = resolve;

            });


        await previous;


        try {

            return await callback();

        }
        finally {

            release();

        }

    }


    // ==================================================
    // EXCHANGE KEY
    // ==================================================

    normalizeExchange(exchange) {

        return String(
            exchange ?? ""
        )
        .trim()
        .toUpperCase();

    }


    // ==================================================
    // GET PENDING RESERVATION
    // ==================================================

    getPendingMargin(exchange) {

        const key =
            this.normalizeExchange(
                exchange
            );


        return Number(
            this.pendingMarginReservations.get(
                key
            ) ?? 0
        );

    }


    // ==================================================
    // ADD PENDING RESERVATION
    // ==================================================

    addPendingMargin(
        exchange,
        margin
    ) {

        const key =
            this.normalizeExchange(
                exchange
            );


        const current =
            this.getPendingMargin(
                key
            );


        this.pendingMarginReservations.set(
            key,
            Number(
                (
                    current +
                    Number(margin)
                )
                .toFixed(8)
            )
        );

    }


    // ==================================================
    // REMOVE PENDING RESERVATION
    // ==================================================

    removePendingMargin(
        exchange,
        margin
    ) {

        const key =
            this.normalizeExchange(
                exchange
            );


        const current =
            this.getPendingMargin(
                key
            );


        const remaining =
            Math.max(
                0,
                current -
                Number(margin)
            );


        if (
            remaining <= 0
        ) {

            this.pendingMarginReservations.delete(
                key
            );

        }
        else {

            this.pendingMarginReservations.set(
                key,
                Number(
                    remaining.toFixed(8)
                )
            );

        }

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

                    initialBalance:
                        Number(row.initial_balance ?? 0),

                    balance:
                        Number(row.balance ?? 0),

                    equity:
                        Number(row.equity ?? 0),

                    availableBalance:
                        Number(row.available_balance ?? 0),

                    usedMargin:
                        Number(row.used_margin ?? 0),

                    positionExposure:
                        Number(row.position_exposure ?? 0),

                    unrealizedPnl:
                        Number(row.unrealized_pnl ?? 0),

                    realizedPnl:
                        Number(row.realized_pnl ?? 0),

                    totalPnl:
                        Number(row.total_pnl ?? 0),

                    fees:
                        Number(row.fees ?? 0),

                    fundingFees:
                        Number(row.funding_fees ?? 0),

                    depositTotal:
                        Number(row.deposit_total ?? 0),

                    withdrawalTotal:
                        Number(row.withdrawal_total ?? 0),

                    totalTrades:
                        Number(row.total_trades ?? 0),

                    winningTrades:
                        Number(row.winning_trades ?? 0),

                    losingTrades:
                        Number(row.losing_trades ?? 0),

                    winRate:
                        Number(row.win_rate ?? 0),

                    profitFactor:
                        Number(row.profit_factor ?? 0),

                    averageProfit:
                        Number(row.average_profit ?? 0),

                    averageLoss:
                        Number(row.average_loss ?? 0),

                    largestProfit:
                        Number(row.largest_profit ?? 0),

                    largestLoss:
                        Number(row.largest_loss ?? 0),

                    consecutiveWins:
                        Number(row.consecutive_wins ?? 0),

                    consecutiveLosses:
                        Number(row.consecutive_losses ?? 0),

                    grossProfit:
                        Number(row.gross_profit ?? 0),

                    grossLoss:
                        Number(row.gross_loss ?? 0),

                    todayPnl:
                        Number(row.today_pnl ?? 0),

                    weeklyPnl:
                        Number(row.weekly_pnl ?? 0),

                    monthlyPnl:
                        Number(row.monthly_pnl ?? 0),

                    assets:
                        row.assets ?? [],

                    status:
                        row.status ?? "ACTIVE",

                    createdAt:
                        row.created_at,

                    updatedAt:
                        row.updated_at

                }));


            console.log(
                "🟢 PAPER ACCOUNTS RESTORED:",
                this.accounts.length
            );


            for (const account of this.accounts) {

                console.log(
                    "🟢 PAPER ACCOUNT RESTORED:",
                    {
                        accountId:
                            account.accountId,

                        exchange:
                            account.exchange,

                        currency:
                            account.currency,

                        initialBalance:
                            account.initialBalance,

                        balance:
                            account.balance,

                        equity:
                            account.equity,

                        availableBalance:
                            account.availableBalance,

                        usedMargin:
                            account.usedMargin,

                        positionExposure:
                            account.positionExposure,

                        unrealizedPnL:
                            account.unrealizedPnl,

                        realizedPnL:
                            account.realizedPnl,

                        totalPnl:
                            account.totalPnl,

                        pnl:
                            account.totalPnl,

                        todayPnl:
                            account.todayPnl,

                        weeklyPnl:
                            account.weeklyPnl,

                        monthlyPnl:
                            account.monthlyPnl,

                        depositTotal:
                            account.depositTotal,

                        withdrawalTotal:
                            account.withdrawalTotal,

                        tradingFees:
                            account.fees,

                        fees:
                            account.fees,

                        fundingFees:
                            account.fundingFees,

                        totalTrades:
                            account.totalTrades,

                        winningTrades:
                            account.winningTrades,

                        losingTrades:
                            account.losingTrades,

                        winRate:
                            account.winRate,

                        profitFactor:
                            account.profitFactor,

                        averageProfit:
                            account.averageProfit,

                        averageLoss:
                            account.averageLoss,

                        largestProfit:
                            account.largestProfit,

                        largestLoss:
                            account.largestLoss,

                        consecutiveWins:
                            account.consecutiveWins,

                        consecutiveLosses:
                            account.consecutiveLosses,

                        grossProfit:
                            account.grossProfit,

                        grossLoss:
                            account.grossLoss,

                        status:
                            account.status
                    }
                );

            }

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT DATABASE LOAD ERROR:",
                error?.message || error
            );

            this.accounts = [];

        }

    }


    // ==================================================
    // CREATE ACCOUNT
    // ==================================================

    async create(account) {

        if (!account) {

            return null;

        }


        const accountId =
            account.accountId ??
            `PAPER-${String(
                account.exchange ?? "UNKNOWN"
            ).toUpperCase()}`;


        const newAccount = {

            accountId,

            exchange:
                account.exchange ?? null,

            name:
                account.name ??
                "Paper Account",

            currency:
                account.currency ??
                "USDT",

            initialBalance:
                Number(account.initialBalance ?? 0),

            balance:
                Number(
                    account.balance ??
                    account.initialBalance ??
                    0
                ),

            equity:
                Number(
                    account.equity ??
                    account.balance ??
                    account.initialBalance ??
                    0
                ),

            availableBalance:
                Number(
                    account.availableBalance ??
                    account.balance ??
                    account.initialBalance ??
                    0
                ),

            usedMargin:
                Number(account.usedMargin ?? 0),

            positionExposure:
                Number(account.positionExposure ?? 0),

            unrealizedPnl:
                Number(account.unrealizedPnl ?? 0),

            realizedPnl:
                Number(account.realizedPnl ?? 0),

            totalPnl:
                Number(account.totalPnl ?? 0),

            fees:
                Number(account.fees ?? 0),

            fundingFees:
                Number(account.fundingFees ?? 0),

            depositTotal:
                Number(account.depositTotal ?? 0),

            withdrawalTotal:
                Number(account.withdrawalTotal ?? 0),

            totalTrades:
                Number(account.totalTrades ?? 0),

            winningTrades:
                Number(account.winningTrades ?? 0),

            losingTrades:
                Number(account.losingTrades ?? 0),

            winRate:
                Number(account.winRate ?? 0),

            profitFactor:
                Number(account.profitFactor ?? 0),

            averageProfit:
                Number(account.averageProfit ?? 0),

            averageLoss:
                Number(account.averageLoss ?? 0),

            largestProfit:
                Number(account.largestProfit ?? 0),

            largestLoss:
                Number(account.largestLoss ?? 0),

            consecutiveWins:
                Number(account.consecutiveWins ?? 0),

            consecutiveLosses:
                Number(account.consecutiveLosses ?? 0),

            grossProfit:
                Number(account.grossProfit ?? 0),

            grossLoss:
                Number(account.grossLoss ?? 0),

            todayPnl:
                Number(account.todayPnl ?? 0),

            weeklyPnl:
                Number(account.weeklyPnl ?? 0),

            monthlyPnl:
                Number(account.monthlyPnl ?? 0),

            assets:
                account.assets ?? [],

            status:
                account.status ?? "ACTIVE"

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

                initial_balance:
                    newAccount.initialBalance,

                balance:
                    newAccount.balance,

                equity:
                    newAccount.equity,

                available_balance:
                    newAccount.availableBalance,

                used_margin:
                    newAccount.usedMargin,

                position_exposure:
                    newAccount.positionExposure,

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

                total_trades:
                    newAccount.totalTrades,

                winning_trades:
                    newAccount.winningTrades,

                losing_trades:
                    newAccount.losingTrades,

                win_rate:
                    newAccount.winRate,

                profit_factor:
                    newAccount.profitFactor,

                average_profit:
                    newAccount.averageProfit,

                average_loss:
                    newAccount.averageLoss,

                largest_profit:
                    newAccount.largestProfit,

                largest_loss:
                    newAccount.largestLoss,

                consecutive_wins:
                    newAccount.consecutiveWins,

                consecutive_losses:
                    newAccount.consecutiveLosses,

                gross_profit:
                    newAccount.grossProfit,

                gross_loss:
                    newAccount.grossLoss,

                today_pnl:
                    newAccount.todayPnl,

                weekly_pnl:
                    newAccount.weeklyPnl,

                monthly_pnl:
                    newAccount.monthlyPnl,

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

        const normalizedExchange =
            this.normalizeExchange(
                exchange
            );


        return this.accounts.find(

            account =>

                this.normalizeExchange(
                    account.exchange
                ) ===
                normalizedExchange

        ) ?? null;

    }


    // ==================================================
    // GET BALANCE
    // ==================================================

    getBalance(exchange = null) {

        let account;


        if (exchange) {

            account =
                this.getByExchange(
                    exchange
                );

        }


        if (!account) {

            account =
                this.accounts.find(

                    item =>

                        String(
                            item.status ?? "ACTIVE"
                        )
                        .toUpperCase() ===
                        "ACTIVE"

                ) ?? null;

        }


        if (!account) {

            return 0;

        }


        return Number(
            account.balance ?? 0
        );

    }


    // ==================================================
    // RESERVE PAPER MARGIN
    // ==================================================

    async reserveMargin(
        exchange,
        margin
    ) {

        if (this.ready) {

            await this.ready;

        }


        return await this.runMarginLock(
            async () => {

                const value =
                    Number(margin);


                if (
                    !Number.isFinite(value) ||
                    value <= 0
                ) {

                    return false;

                }


                const account =
                    this.getByExchange(
                        exchange
                    );


                if (!account) {

                    console.error(
                        "❌ PAPER RESERVE MARGIN: ACCOUNT NOT FOUND",
                        exchange
                    );

                    return false;

                }


                const normalizedExchange =
                    this.normalizeExchange(
                        account.exchange
                    );


                // ------------------------------------------------
                // بسیار مهم:
                //
                // usedMargin بعد از هر reserve شامل Pending
                // نیز هست.
                //
                // بنابراین Pending را دوباره از available
                // کم نمی‌کنیم.
                // ------------------------------------------------

                const equity =
                    Number(
                        account.equity ?? 0
                    );


                const currentUsedMargin =
                    Number(
                        account.usedMargin ?? 0
                    );


                const effectiveAvailable =
                    Number(
                        Math.max(
                            0,
                            equity -
                            currentUsedMargin
                        )
                        .toFixed(8)
                    );


                if (
                    value >
                    effectiveAvailable
                ) {

                    console.error(
                        "❌ PAPER RESERVE MARGIN: INSUFFICIENT BALANCE",
                        {
                            exchange:
                                account.exchange,

                            requested:
                                value,

                            equity,

                            usedMargin:
                                currentUsedMargin,

                            pendingReservation:
                                this.getPendingMargin(
                                    normalizedExchange
                                ),

                            effectiveAvailable
                        }
                    );

                    return false;

                }


                // ------------------------------------------------
                // Pending قبل از update ثبت می‌شود.
                // ------------------------------------------------

                this.addPendingMargin(
                    normalizedExchange,
                    value
                );


                const newUsedMargin =
                    Number(
                        (
                            currentUsedMargin +
                            value
                        )
                        .toFixed(8)
                    );


                const currentExposure =
                    Number(
                        account.positionExposure ?? 0
                    );


                const newExposure =
                    Number(
                        (
                            currentExposure +
                            value
                        )
                        .toFixed(8)
                    );


                const newAvailable =
                    Number(
                        Math.max(
                            0,
                            equity -
                            newUsedMargin
                        )
                        .toFixed(8)
                    );


                account.usedMargin =
                    newUsedMargin;


                account.positionExposure =
                    newExposure;


                account.availableBalance =
                    newAvailable;


                account.equity =
                    Number(
                        (
                            Number(
                                account.balance ?? 0
                            ) +
                            Number(
                                account.unrealizedPnl ?? 0
                            )
                        )
                        .toFixed(8)
                    );


                this._insideMarginReservationUpdate =
                    true;


                try {

                    await this.update(
                        account.id,
                        account
                    );

                }
                catch (error) {

                    // --------------------------------------------
                    // Rollback کامل
                    // --------------------------------------------

                    this.removePendingMargin(
                        normalizedExchange,
                        value
                    );


                    account.usedMargin =
                        Number(
                            Math.max(
                                0,
                                newUsedMargin -
                                value
                            )
                            .toFixed(8)
                        );


                    account.positionExposure =
                        Number(
                            Math.max(
                                0,
                                newExposure -
                                value
                            )
                            .toFixed(8)
                        );


                    account.availableBalance =
                        Number(
                            Math.max(
                                0,
                                equity -
                                account.usedMargin
                            )
                            .toFixed(8)
                        );


                    console.error(
                        "❌ PAPER RESERVE MARGIN UPDATE ERROR:",
                        error?.message || error
                    );


                    return false;

                }
                finally {

                    this._insideMarginReservationUpdate =
                        false;

                }


                console.log(
                    "💰 PAPER MARGIN RESERVED:",
                    {
                        exchange:
                            account.exchange,

                        margin:
                            value,

                        availableBalance:
                            account.availableBalance,

                        usedMargin:
                            account.usedMargin,

                        positionExposure:
                            account.positionExposure,

                        pendingReservation:
                            this.getPendingMargin(
                                normalizedExchange
                            )
                    }
                );


                // ------------------------------------------------
                // مهم:
                //
                // اینجا Pending حذف نمی‌شود.
                //
                // PositionStore.syncPaperAccount()
                // بعد از ساخته شدن Position واقعی،
                // Pending را reconcile می‌کند.
                // ------------------------------------------------

                return true;

            }
        );

    }


    // ==================================================
    // RELEASE PAPER MARGIN
    // ==================================================

    async releaseMargin(
        exchangeOrMargin,
        marginOrExchange
    ) {

        if (this.ready) {

            await this.ready;

        }


        return await this.runMarginLock(
            async () => {

                let exchange;
                let margin;


                if (
                    typeof exchangeOrMargin === "string"
                ) {

                    exchange =
                        exchangeOrMargin;

                    margin =
                        marginOrExchange;

                }
                else {

                    margin =
                        exchangeOrMargin;

                    exchange =
                        marginOrExchange;

                }


                const value =
                    Number(margin);


                if (
                    !Number.isFinite(value) ||
                    value <= 0
                ) {

                    return false;

                }


                const account =
                    this.getByExchange(
                        exchange
                    );


                if (!account) {

                    console.error(
                        "❌ PAPER RELEASE MARGIN: ACCOUNT NOT FOUND",
                        exchange
                    );

                    return false;

                }


                const normalizedExchange =
                    this.normalizeExchange(
                        account.exchange
                    );


                const currentUsedMargin =
                    Number(
                        account.usedMargin ?? 0
                    );


                // ------------------------------------------------
                // مقدار واقعی که می‌توان آزاد کرد.
                //
                // usedMargin شامل Pending نیز هست.
                // بنابراین کل value باید از usedMargin کم شود.
                // ------------------------------------------------

                const released =
                    Math.min(
                        value,
                        currentUsedMargin
                    );


                const pending =
                    this.getPendingMargin(
                        normalizedExchange
                    );


                const pendingReleased =
                    Math.min(
                        value,
                        pending
                    );


                if (
                    pendingReleased > 0
                ) {

                    this.removePendingMargin(
                        normalizedExchange,
                        pendingReleased
                    );

                }


                account.usedMargin =
                    Number(
                        Math.max(
                            0,
                            currentUsedMargin -
                            released
                        )
                        .toFixed(8)
                    );


                const currentExposure =
                    Number(
                        account.positionExposure ?? 0
                    );


                account.positionExposure =
                    Number(
                        Math.max(
                            0,
                            currentExposure -
                            released
                        )
                        .toFixed(8)
                    );


                account.equity =
                    Number(
                        (
                            Number(
                                account.balance ?? 0
                            ) +
                            Number(
                                account.unrealizedPnl ?? 0
                            )
                        )
                        .toFixed(8)
                    );


                account.availableBalance =
                    Number(
                        Math.max(
                            0,
                            account.equity -
                            account.usedMargin
                        )
                        .toFixed(8)
                    );


                await this.update(
                    account.id,
                    account
                );


                console.log(
                    "💰 PAPER MARGIN RELEASED:",
                    {
                        exchange:
                            account.exchange,

                        requested:
                            value,

                        released,

                        pendingReleased:
                            pendingReleased,

                        availableBalance:
                            account.availableBalance,

                        usedMargin:
                            account.usedMargin,

                        positionExposure:
                            account.positionExposure,

                        pendingReservation:
                            this.getPendingMargin(
                                normalizedExchange
                            )
                    }
                );


                return true;

            }
        );

    }


    // ==================================================
    // APPLY REALIZED PNL
    // ==================================================

    async applyRealizedPnL(
        exchange,
        pnl
    ) {

        if (
            this.ready
        ) {

            await this.ready;

        }


        let account;
        let value;


        if (
            typeof exchange === "string"
        ) {

            account =
                this.getByExchange(
                    exchange
                );

            value =
                Number(pnl);

        }
        else {

            value =
                Number(exchange);

            account =
                this.accounts.find(
                    item =>
                        String(
                            item.status ?? "ACTIVE"
                        ).toUpperCase() ===
                        "ACTIVE"
                ) ?? null;

        }


        if (!account) {

            console.error(
                "❌ PAPER REALIZED PNL: ACCOUNT NOT FOUND"
            );

            return false;

        }


        if (
            !Number.isFinite(value)
        ) {

            console.error(
                "❌ PAPER REALIZED PNL: INVALID PNL",
                value
            );

            return false;

        }


        account.balance =
            Number(
                (
                    Number(
                        account.balance ?? 0
                    ) +
                    value
                )
                .toFixed(8)
            );


        account.realizedPnl =
            Number(
                (
                    Number(
                        account.realizedPnl ?? 0
                    ) +
                    value
                )
                .toFixed(8)
            );


        account.equity =
            Number(
                (
                    Number(
                        account.balance ?? 0
                    ) +
                    Number(
                        account.unrealizedPnl ?? 0
                    )
                )
                .toFixed(8)
            );


        account.totalPnl =
            Number(
                (
                    Number(
                        account.realizedPnl ?? 0
                    ) +
                    Number(
                        account.unrealizedPnl ?? 0
                    )
                )
                .toFixed(8)
            );


        await this.update(
            account.id,
            account
        );


        console.log(
            "💰 PAPER REALIZED PNL APPLIED:",
            {
                exchange:
                    account.exchange,

                pnl:
                    value,

                balance:
                    account.balance,

                realizedPnl:
                    account.realizedPnl,

                equity:
                    account.equity,

                totalPnl:
                    account.totalPnl
            }
        );


        return true;

    }


    // ==================================================
    // UPDATE
    // ==================================================

    async update(id, data) {

        const account =
            this.getById(id);


        if (!account) {

            return null;

        }


        const normalizedExchange =
            this.normalizeExchange(
                account.exchange
            );


        const pendingBefore =
            this.getPendingMargin(
                normalizedExchange
            );


        const previousUsedMargin =
            Number(
                account.usedMargin ?? 0
            );


        const previousExposure =
            Number(
                account.positionExposure ?? 0
            );


        const incomingUsedMargin =
            data &&
            data.usedMargin !== undefined
                ? Number(data.usedMargin)
                : previousUsedMargin;


        const incomingExposure =
            data &&
            data.positionExposure !== undefined
                ? Number(data.positionExposure)
                : previousExposure;


        const isInternalReservationUpdate =
            this._insideMarginReservationUpdate === true;


        let updateData = {
            ...data
        };


        // ------------------------------------------------
        // Pending Margin Reconciliation
        //
        // previousUsedMargin شامل:
        //
        // actualMargin + pendingMargin
        //
        // بنابراین:
        //
        // actualBeforePending =
        // previousUsedMargin - pendingBefore
        //
        // سپس مقدار Margin واقعی که PositionStore
        // در sync آورده است را محاسبه می‌کنیم.
        // ------------------------------------------------

        if (
            !isInternalReservationUpdate &&
            pendingBefore > 0 &&
            Number.isFinite(incomingUsedMargin)
        ) {

            const baselineUsedMargin =
                Math.max(
                    0,
                    previousUsedMargin -
                    pendingBefore
                );


            const consumedPending =
                Math.min(
                    pendingBefore,
                    Math.max(
                        0,
                        incomingUsedMargin -
                        baselineUsedMargin
                    )
                );


            const remainingPending =
                Number(
                    Math.max(
                        0,
                        pendingBefore -
                        consumedPending
                    )
                    .toFixed(8)
                );


            // ------------------------------------------------
            // اگر Position واقعی هنوز تمام Pending را
            // جذب نکرده باشد، باقی Pending را حفظ می‌کنیم.
            // ------------------------------------------------

            updateData.usedMargin =
                Number(
                    (
                        incomingUsedMargin +
                        remainingPending
                    )
                    .toFixed(8)
                );


            // ------------------------------------------------
            // Exposure نیز همان منطق را دارد.
            // ------------------------------------------------

            const baselineExposure =
                Math.max(
                    0,
                    previousExposure -
                    pendingBefore
                );


            const consumedExposure =
                Math.min(
                    pendingBefore,
                    Math.max(
                        0,
                        incomingExposure -
                        baselineExposure
                    )
                );


            const remainingExposurePending =
                Number(
                    Math.max(
                        0,
                        pendingBefore -
                        consumedExposure
                    )
                    .toFixed(8)
                );


            updateData.positionExposure =
                Number(
                    (
                        incomingExposure +
                        remainingExposurePending
                    )
                    .toFixed(8)
                );


            const incomingEquity =
                data &&
                data.equity !== undefined
                    ? Number(data.equity)
                    : Number(account.equity ?? 0);


            updateData.availableBalance =
                Number(
                    Math.max(
                        0,
                        incomingEquity -
                        updateData.usedMargin
                    )
                    .toFixed(8)
                );


            // ------------------------------------------------
            // Pendingهایی که توسط Position واقعی جذب شده‌اند
            // دیگر Pending نیستند.
            // ------------------------------------------------

            if (
                consumedPending > 0
            ) {

                this.removePendingMargin(
                    normalizedExchange,
                    consumedPending
                );

            }

        }


        Object.assign(
            account,
            updateData
        );


        const databaseData = {

            initial_balance:
                account.initialBalance,

            balance:
                account.balance,

            equity:
                account.equity,

            available_balance:
                account.availableBalance,

            used_margin:
                account.usedMargin,

            position_exposure:
                account.positionExposure,

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

            total_trades:
                account.totalTrades,

            winning_trades:
                account.winningTrades,

            losing_trades:
                account.losingTrades,

            win_rate:
                account.winRate,

            profit_factor:
                account.profitFactor,

            average_profit:
                account.averageProfit,

            average_loss:
                account.averageLoss,

            largest_profit:
                account.largestProfit,

            largest_loss:
                account.largestLoss,

            consecutive_wins:
                account.consecutiveWins,

            consecutive_losses:
                account.consecutiveLosses,

            gross_profit:
                account.grossProfit,

            gross_loss:
                account.grossLoss,

            today_pnl:
                account.todayPnl,

            weekly_pnl:
                account.weeklyPnl,

            monthly_pnl:
                account.monthlyPnl,

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
    // RESET PERIOD PNL
    // ==================================================

    resetPeriodPnls(account) {

        if (!account) {

            return;

        }


        const now =
            new Date();


        const lastUpdate =
            account.updatedAt
                ? new Date(account.updatedAt)
                : null;


        if (
            lastUpdate &&
            !Number.isNaN(
                lastUpdate.getTime()
            )
        ) {

            if (
                now.toDateString() !==
                lastUpdate.toDateString()
            ) {

                account.todayPnl = 0;

            }


            const weekStart =
                new Date(now);


            weekStart.setHours(
                0,
                0,
                0,
                0
            );


            weekStart.setDate(
                now.getDate() -
                now.getDay()
            );


            const lastWeekStart =
                new Date(lastUpdate);


            lastWeekStart.setHours(
                0,
                0,
                0,
                0
            );


            lastWeekStart.setDate(
                lastUpdate.getDate() -
                lastWeekStart.getDay()
            );


            if (
                weekStart.getTime() !==
                lastWeekStart.getTime()
            ) {

                account.weeklyPnl = 0;

            }


            const sameMonth =
                now.getFullYear() ===
                lastUpdate.getFullYear() &&
                now.getMonth() ===
                lastUpdate.getMonth();


            if (!sameMonth) {

                account.monthlyPnl = 0;

            }

        }

    }


    // ==================================================
    // RECORD CLOSED PAPER TRADE
    // ==================================================

    async recordTrade(
        id,
        pnl,
        fees = 0
    ) {

        const account =
            this.getById(id);


        if (!account) {

            console.error(
                "❌ PAPER RECORD TRADE: ACCOUNT NOT FOUND",
                id
            );

            return null;

        }


        const tradePnl =
            Number(pnl);


        const tradeFees =
            Number(fees);


        if (
            !Number.isFinite(tradePnl) ||
            !Number.isFinite(tradeFees)
        ) {

            console.error(
                "❌ PAPER RECORD TRADE: INVALID VALUES",
                {
                    pnl,
                    fees
                }
            );

            return null;

        }


        const netPnl =
            Number(
                (
                    tradePnl -
                    tradeFees
                )
                .toFixed(2)
            );


        this.resetPeriodPnls(
            account
        );


        account.totalTrades =
            Number(
                account.totalTrades ?? 0
            ) + 1;


        if (netPnl > 0) {

            account.winningTrades =
                Number(
                    account.winningTrades ?? 0
                ) + 1;


            account.grossProfit =
                Number(
                    (
                        Number(
                            account.grossProfit ?? 0
                        ) +
                        netPnl
                    )
                    .toFixed(2)
                );


            account.averageProfit =
                Number(
                    (
                        account.grossProfit /
                        account.winningTrades
                    )
                    .toFixed(2)
                );


            account.largestProfit =
                Math.max(
                    Number(
                        account.largestProfit ?? 0
                    ),
                    netPnl
                );


            account.consecutiveWins =
                Number(
                    account.consecutiveWins ?? 0
                ) + 1;


            account.consecutiveLosses =
                0;

        }
        else if (netPnl < 0) {

            account.losingTrades =
                Number(
                    account.losingTrades ?? 0
                ) + 1;


            account.grossLoss =
                Number(
                    (
                        Number(
                            account.grossLoss ?? 0
                        ) +
                        Math.abs(netPnl)
                    )
                    .toFixed(2)
                );


            account.averageLoss =
                Number(
                    (
                        account.grossLoss /
                        account.losingTrades
                    )
                    .toFixed(2)
                );


            account.largestLoss =
                Math.max(
                    Number(
                        account.largestLoss ?? 0
                    ),
                    Math.abs(netPnl)
                );


            account.consecutiveLosses =
                Number(
                    account.consecutiveLosses ?? 0
                ) + 1;


            account.consecutiveWins =
                0;

        }


        account.winRate =
            account.totalTrades > 0
                ? Number(
                    (
                        (
                            account.winningTrades /
                            account.totalTrades
                        ) *
                        100
                    )
                    .toFixed(2)
                )
                : 0;


        account.profitFactor =
            account.grossLoss > 0
                ? Number(
                    (
                        account.grossProfit /
                        account.grossLoss
                    )
                    .toFixed(2)
                )
                : 0;


        account.realizedPnl =
            Number(
                (
                    Number(
                        account.realizedPnl ?? 0
                    ) +
                    netPnl
                )
                .toFixed(2)
            );


        account.fees =
            Number(
                (
                    Number(
                        account.fees ?? 0
                    ) +
                    tradeFees
                )
                .toFixed(2)
            );


        account.todayPnl =
            Number(
                (
                    Number(
                        account.todayPnl ?? 0
                    ) +
                    netPnl
                )
                .toFixed(2)
            );


        account.weeklyPnl =
            Number(
                (
                    Number(
                        account.weeklyPnl ?? 0
                    ) +
                    netPnl
                )
                .toFixed(2)
            );


        account.monthlyPnl =
            Number(
                (
                    Number(
                        account.monthlyPnl ?? 0
                    ) +
                    netPnl
                )
                .toFixed(2)
            );


        account.totalPnl =
            Number(
                (
                    Number(
                        account.realizedPnl ?? 0
                    ) +
                    Number(
                        account.unrealizedPnl ?? 0
                    )
                )
                .toFixed(2)
            );


        console.log(
            "📊 PAPER TRADE STATISTICS UPDATED:",
            {

                accountId:
                    account.accountId,

                pnl:
                    tradePnl,

                fees:
                    tradeFees,

                netPnl,

                totalTrades:
                    account.totalTrades,

                winningTrades:
                    account.winningTrades,

                losingTrades:
                    account.losingTrades,

                winRate:
                    account.winRate,

                profitFactor:
                    account.profitFactor,

                averageProfit:
                    account.averageProfit,

                averageLoss:
                    account.averageLoss,

                largestProfit:
                    account.largestProfit,

                largestLoss:
                    account.largestLoss,

                consecutiveWins:
                    account.consecutiveWins,

                consecutiveLosses:
                    account.consecutiveLosses,

                todayPnl:
                    account.todayPnl,

                weeklyPnl:
                    account.weeklyPnl,

                monthlyPnl:
                    account.monthlyPnl

            }
        );


        return await this.update(
            id,
            account
        );

    }


    // ==================================================
    // ADD DEPOSIT
    // ==================================================

    async deposit(
        id,
        amount
    ) {

        const value =
            Number(amount);


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {

            return null;

        }


        const account =
            this.getById(id);


        if (!account) {

            return null;

        }


        account.balance += value;

        account.equity += value;

        account.availableBalance += value;

        account.depositTotal += value;


        return await this.update(
            id,
            account
        );

    }


    // ==================================================
    // WITHDRAW
    // ==================================================

    async withdraw(
        id,
        amount
    ) {

        const value =
            Number(amount);


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {

            return null;

        }


        const account =
            this.getById(id);


        if (!account) {

            return null;

        }


        if (
            value >
            account.availableBalance
        ) {

            return null;

        }


        account.balance -= value;

        account.equity -= value;

        account.availableBalance -= value;

        account.withdrawalTotal += value;


        return await this.update(
            id,
            account
        );

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new PaperAccountStore();