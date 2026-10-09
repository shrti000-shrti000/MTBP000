
//



// ======================================================
// MTBP
// Paper Trading Manager
//
// مسئول:
// مدیریت کامل حساب مجازی Paper Trading
//
// SOURCE OF TRUTH:
// PostgreSQL / PaperAccountStore
//
// نکته:
// موجودی Paper کاملاً مستقل از موجودی واقعی صرافی است.
// ======================================================

import PaperAccountStore
    from "../storage/PaperAccountStore.js";


// ======================================================
// PAPER TRADING MANAGER
// ======================================================

class PaperTradingManager {


    constructor() {

        // ==============================================
        // ACCOUNT CONFIG
        // ==============================================

        this.accountId =
            "PAPER-TOOBIT";

        this.exchange =
            "toobit";

        this.currency =
            "USDT";


        // ==============================================
        // DEFAULT INITIAL BALANCE
        // ==============================================

        this.initialBalance =
            10000;


        // ==============================================
        // ACCOUNT STATE
        // ==============================================

        this.balance =
            0;

        this.equity =
            0;

        this.availableBalance =
            0;

        this.usedMargin =
            0;

        this.positionExposure =
            0;


        // ==============================================
        // PNL
        // ==============================================

        this.unrealizedPnL =
            0;

        this.realizedPnL =
            0;

        this.totalPnl =
            0;


        // ==============================================
        // FEES
        // ==============================================

        this.tradingFees =
            0;

        this.fundingFees =
            0;


        // ==============================================
        // CAPITAL FLOW
        // ==============================================

        this.depositTotal =
            0;

        this.withdrawalTotal =
            0;


        // ==============================================
        // TRADING STATISTICS
        // ==============================================

        this.totalTrades =
            0;

        this.winningTrades =
            0;

        this.losingTrades =
            0;

        this.winRate =
            0;

        this.profitFactor =
            0;

        this.averageProfit =
            0;

        this.averageLoss =
            0;

        this.largestProfit =
            0;

        this.largestLoss =
            0;

        this.consecutiveWins =
            0;

        this.consecutiveLosses =
            0;


        // ==============================================
        // INTERNAL STATISTICS
        //
        // برای محاسبه دقیق Average / Profit Factor
        // ==============================================

        this.grossProfit =
            0;

        this.grossLoss =
            0;


        // ==============================================
        // PERIOD PNL
        // ==============================================

        this.todayPnl =
            0;

        this.weeklyPnl =
            0;

        this.monthlyPnl =
            0;


        // ==============================================
        // STATUS
        // ==============================================

        this.status =
            "ACTIVE";


        // ==============================================
        // DATABASE READY
        // ==============================================

        this.ready =
            this.loadFromDatabase();

    }



    // ==================================================
    // LOAD ACCOUNT
    // ==================================================

    async loadFromDatabase() {

        try {

            await PaperAccountStore.ready;


            let account =
                PaperAccountStore.getByAccountId(
                    this.accountId
                );


            // ==========================================
            // CREATE ACCOUNT IF NOT EXISTS
            // ==========================================

            if (!account) {

                account =
                    await PaperAccountStore.create({

                        accountId:
                            this.accountId,

                        exchange:
                            this.exchange,

                        name:
                            "MTBP Paper Account",

                        currency:
                            this.currency,

                        initialBalance:
                            this.initialBalance,

                        balance:
                            this.initialBalance,

                        equity:
                            this.initialBalance,

                        availableBalance:
                            this.initialBalance,

                        usedMargin:
                            0,

                        positionExposure:
                            0,

                        unrealizedPnl:
                            0,

                        realizedPnl:
                            0,

                        totalPnl:
                            0,

                        fees:
                            0,

                        fundingFees:
                            0,

                        depositTotal:
                            this.initialBalance,

                        withdrawalTotal:
                            0,

                        totalTrades:
                            0,

                        winningTrades:
                            0,

                        losingTrades:
                            0,

                        winRate:
                            0,

                        profitFactor:
                            0,

                        averageProfit:
                            0,

                        averageLoss:
                            0,

                        largestProfit:
                            0,

                        largestLoss:
                            0,

                        consecutiveWins:
                            0,

                        consecutiveLosses:
                            0,

                        todayPnl:
                            0,

                        weeklyPnl:
                            0,

                        monthlyPnl:
                            0,

                        assets:
                            [],

                        status:
                            "ACTIVE"

                    });

            }


            if (!account) {

                throw new Error(
                    "Paper account could not be loaded or created."
                );

            }


            // ==========================================
            // EXISTING ACCOUNT MIGRATION
            // ==========================================

            const existingInitialBalance =
                this.toNumber(
                    account.initialBalance,
                    this.initialBalance
                );

            const existingBalance =
                this.toNumber(
                    account.balance,
                    0
                );

            const existingTotalTrades =
                this.toNumber(
                    account.totalTrades,
                    0
                );

            const existingDepositTotal =
                this.toNumber(
                    account.depositTotal,
                    0
                );


            if (

                existingDepositTotal === 0 &&

                existingInitialBalance > 0 &&

                existingTotalTrades === 0 &&

                Math.abs(
                    existingBalance -
                    existingInitialBalance
                ) < 0.00000001

            ) {

                account.depositTotal =
                    existingInitialBalance;


                try {

                    await PaperAccountStore.update(

                        account.id,

                        {

                            depositTotal:
                                existingInitialBalance

                        }

                    );

                }
                catch (migrationError) {

                    console.error(

                        "⚠️ PAPER ACCOUNT DEPOSIT MIGRATION ERROR:",

                        migrationError?.message ||
                        migrationError

                    );

                }

            }


            // ==========================================
            // RESTORE
            // ==========================================

            this.restoreFromAccount(
                account
            );


           // console.log(
              //  "🟢 PAPER ACCOUNT RESTORED:",
              //  this.getState()
           // );


            return account;

        }
        catch (error) {

            console.error(

                "❌ PAPER ACCOUNT LOAD ERROR:",

                error?.message ||
                error

            );


            this.resetRuntimeState();


            return null;

        }

    }



    // ==================================================
    // RESET RUNTIME STATE
    // ==================================================

    resetRuntimeState() {

        this.balance =
            0;

        this.equity =
            0;

        this.availableBalance =
            0;

        this.usedMargin =
            0;

        this.positionExposure =
            0;

        this.unrealizedPnL =
            0;

        this.realizedPnL =
            0;

        this.totalPnl =
            0;

        this.tradingFees =
            0;

        this.fundingFees =
            0;

        this.depositTotal =
            0;

        this.withdrawalTotal =
            0;

        this.totalTrades =
            0;

        this.winningTrades =
            0;

        this.losingTrades =
            0;

        this.winRate =
            0;

        this.profitFactor =
            0;

        this.averageProfit =
            0;

        this.averageLoss =
            0;

        this.largestProfit =
            0;

        this.largestLoss =
            0;

        this.consecutiveWins =
            0;

        this.consecutiveLosses =
            0;

        this.grossProfit =
            0;

        this.grossLoss =
            0;

        this.todayPnl =
            0;

        this.weeklyPnl =
            0;

        this.monthlyPnl =
            0;

        this.status =
            "ACTIVE";

    }



    // ==================================================
    // RESTORE FROM ACCOUNT
    // ==================================================

    restoreFromAccount(
        account
    ) {

        if (!account) {

            return;

        }


        this.initialBalance =
            this.toNumber(
                account.initialBalance,
                this.initialBalance
            );


        this.balance =
            this.toNumber(
                account.balance,
                0
            );


        this.usedMargin =
            this.toNumber(
                account.usedMargin,
                0
            );


        this.positionExposure =
            this.toNumber(
                account.positionExposure,
                0
            );


        this.unrealizedPnL =
            this.toNumber(
                account.unrealizedPnl,
                0
            );


        this.realizedPnL =
            this.toNumber(
                account.realizedPnl,
                0
            );


        this.totalPnl =
            this.toNumber(
                account.totalPnl,
                this.realizedPnL
            );


        // ==============================================
        // FEES
        // ==============================================

        this.tradingFees =
            this.toNumber(
                account.fees,
                0
            );


        this.fundingFees =
            this.toNumber(
                account.fundingFees,
                0
            );


        // ==============================================
        // CAPITAL FLOW
        // ==============================================

        this.depositTotal =
            this.toNumber(
                account.depositTotal,
                this.initialBalance
            );


        this.withdrawalTotal =
            this.toNumber(
                account.withdrawalTotal,
                0
            );


        // ==============================================
        // TRADING STATISTICS
        // ==============================================

        this.totalTrades =
            this.toNumber(
                account.totalTrades,
                0
            );


        this.winningTrades =
            this.toNumber(
                account.winningTrades,
                0
            );


        this.losingTrades =
            this.toNumber(
                account.losingTrades,
                0
            );


        this.winRate =
            this.toNumber(
                account.winRate,
                0
            );


        this.profitFactor =
            this.toNumber(
                account.profitFactor,
                0
            );


        this.averageProfit =
            this.toNumber(
                account.averageProfit,
                0
            );


        this.averageLoss =
            this.toNumber(
                account.averageLoss,
                0
            );


        this.largestProfit =
            this.toNumber(
                account.largestProfit,
                0
            );


        this.largestLoss =
            this.toNumber(
                account.largestLoss,
                0
            );


        this.consecutiveWins =
            this.toNumber(
                account.consecutiveWins,
                0
            );


        this.consecutiveLosses =
            this.toNumber(
                account.consecutiveLosses,
                0
            );


        // ==============================================
        // PERIOD PNL
        // ==============================================

        this.todayPnl =
            this.toNumber(
                account.todayPnl,
                0
            );


        this.weeklyPnl =
            this.toNumber(
                account.weeklyPnl,
                0
            );


        this.monthlyPnl =
            this.toNumber(
                account.monthlyPnl,
                0
            );


        // ==============================================
        // INTERNAL STATISTICS
        //
        // PostgreSQL فعلاً grossProfit/grossLoss ندارد.
        // بنابراین از اطلاعات موجود بازسازی می‌کنیم.
        // ==============================================

        this.grossProfit =
            this.averageProfit *
            this.winningTrades;


        this.grossLoss =
            this.averageLoss *
            this.losingTrades;


        // ==============================================
        // STATUS
        // ==============================================

        this.status =
            account.status ||
            "ACTIVE";


        // ==============================================
        // EQUITY
        // ==============================================

        this.equity =
            this.toNumber(
                account.equity,
                this.balance +
                this.unrealizedPnL
            );


        // ==============================================
        // AVAILABLE BALANCE
        // ==============================================

        this.availableBalance =
            this.toNumber(
                account.availableBalance,
                this.balance -
                this.usedMargin
            );


        this.normalizeState();

    }



    // ==================================================
    // NUMBER
    // ==================================================

    toNumber(
        value,
        fallback = 0
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return fallback;

        }


        return number;

    }



    // ==================================================
    // ROUND
    // ==================================================

    round(
        value,
        decimals = 2
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return 0;

        }


        return Number(
            number.toFixed(
                decimals
            )
        );

    }



    // ==================================================
    // NORMALIZE
    // ==================================================

    normalizeState() {

        // ==============================================
        // INITIAL BALANCE
        // ==============================================

        if (
            !Number.isFinite(
                this.initialBalance
            ) ||
            this.initialBalance < 0
        ) {

            this.initialBalance =
                0;

        }


        // ==============================================
        // BALANCE
        // ==============================================

        if (
            !Number.isFinite(
                this.balance
            ) ||
            this.balance < 0
        ) {

            this.balance =
                0;

        }


        // ==============================================
        // USED MARGIN
        // ==============================================

        if (
            !Number.isFinite(
                this.usedMargin
            ) ||
            this.usedMargin < 0
        ) {

            this.usedMargin =
                0;

        }


        if (
            this.usedMargin >
            this.balance
        ) {

            this.usedMargin =
                this.balance;

        }


        // ==============================================
        // POSITION EXPOSURE
        // ==============================================

        if (
            !Number.isFinite(
                this.positionExposure
            ) ||
            this.positionExposure < 0
        ) {

            this.positionExposure =
                0;

        }


        // ==============================================
        // PNL
        // ==============================================

        if (
            !Number.isFinite(
                this.unrealizedPnL
            )
        ) {

            this.unrealizedPnL =
                0;

        }


        if (
            !Number.isFinite(
                this.realizedPnL
            )
        ) {

            this.realizedPnL =
                0;

        }


        // ==============================================
        // FEES
        // ==============================================

        if (
            !Number.isFinite(
                this.tradingFees
            ) ||
            this.tradingFees < 0
        ) {

            this.tradingFees =
                0;

        }


        if (
            !Number.isFinite(
                this.fundingFees
            ) ||
            this.fundingFees < 0
        ) {

            this.fundingFees =
                0;

        }


        // ==============================================
        // CAPITAL FLOW
        // ==============================================

        if (
            !Number.isFinite(
                this.depositTotal
            ) ||
            this.depositTotal < 0
        ) {

            this.depositTotal =
                0;

        }


        if (
            !Number.isFinite(
                this.withdrawalTotal
            ) ||
            this.withdrawalTotal < 0
        ) {

            this.withdrawalTotal =
                0;

        }


        // ==============================================
        // TRADE COUNTERS
        // ==============================================

        this.totalTrades =
            Math.max(
                0,
                Math.floor(
                    this.toNumber(
                        this.totalTrades,
                        0
                    )
                )
            );


        this.winningTrades =
            Math.max(
                0,
                Math.floor(
                    this.toNumber(
                        this.winningTrades,
                        0
                    )
                )
            );


        this.losingTrades =
            Math.max(
                0,
                Math.floor(
                    this.toNumber(
                        this.losingTrades,
                        0
                    )
                )
            );


        // ==============================================
        // INTERNAL GROSS PNL
        // ==============================================

        if (
            !Number.isFinite(
                this.grossProfit
            ) ||
            this.grossProfit < 0
        ) {

            this.grossProfit =
                0;

        }


        if (
            !Number.isFinite(
                this.grossLoss
            ) ||
            this.grossLoss < 0
        ) {

            this.grossLoss =
                0;

        }


        // ==============================================
        // TOTAL PNL
        // ==============================================

        this.totalPnl =
            this.round(
                this.realizedPnL +
                this.unrealizedPnL
            );


        // ==============================================
        // EQUITY
        // ==============================================

        this.equity =
            this.round(
                this.balance +
                this.unrealizedPnL
            );


        // ==============================================
        // AVAILABLE BALANCE
        // ==============================================

        this.availableBalance =
            this.round(
                Math.max(
                    0,
                    this.balance -
                    this.usedMargin
                )
            );


        // ==============================================
        // WIN RATE
        // ==============================================

        if (
            this.totalTrades > 0
        ) {

            this.winRate =
                this.round(
                    (
                        this.winningTrades /
                        this.totalTrades
                    ) *
                    100
                );

        }
        else {

            this.winRate =
                0;

        }


        // ==============================================
        // AVERAGE PROFIT
        // ==============================================

        if (
            this.winningTrades > 0
        ) {

            this.averageProfit =
                this.round(
                    this.grossProfit /
                    this.winningTrades
                );

        }
        else {

            this.averageProfit =
                0;

        }


        // ==============================================
        // AVERAGE LOSS
        // ==============================================

        if (
            this.losingTrades > 0
        ) {

            this.averageLoss =
                this.round(
                    this.grossLoss /
                    this.losingTrades
                );

        }
        else {

            this.averageLoss =
                0;

        }


        // ==============================================
        // PROFIT FACTOR
        //
        // Gross Profit / Gross Loss
        // ==============================================

        if (
            this.grossLoss > 0
        ) {

            this.profitFactor =
                this.round(
                    this.grossProfit /
                    this.grossLoss,
                    4
                );

        }
        else if (
            this.grossProfit > 0
        ) {

            this.profitFactor =
                Infinity;

        }
        else {

            this.profitFactor =
                0;

        }

    }



    // ==================================================
    // WAIT READY
    // ==================================================

    async waitUntilReady() {

        await this.ready;

        return this.getState();

    }



    // ==================================================
    // GET BALANCE
    // ==================================================

    getBalance() {

        return this.balance;

    }



    // ==================================================
    // GET EQUITY
    // ==================================================

    getEquity() {

        return this.equity;

    }



    // ==================================================
    // GET AVAILABLE BALANCE
    // ==================================================

    getAvailableBalance() {

        return this.availableBalance;

    }



    // ==================================================
    // GET USED MARGIN
    // ==================================================

    getUsedMargin() {

        return this.usedMargin;

    }



    // ==================================================
    // GET POSITION EXPOSURE
    // ==================================================

    getPositionExposure() {

        return this.positionExposure;

    }



    // ==================================================
    // SET POSITION EXPOSURE
    // ==================================================

    async setPositionExposure(
        value
    ) {

        await this.ready;


        const exposure =
            Number(value);


        if (
            !Number.isFinite(exposure) ||
            exposure < 0
        ) {

            return false;

        }


        this.positionExposure =
            exposure;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // GET UNREALIZED PNL
    // ==================================================

    getUnrealizedPnL() {

        return this.unrealizedPnL;

    }



    // ==================================================
    // GET REALIZED PNL
    // ==================================================

    getRealizedPnL() {

        return this.realizedPnL;

    }



    // ==================================================
    // GET TOTAL PNL
    // ==================================================

    getPnL() {

        return this.totalPnl;

    }



    // ==================================================
    // SET BALANCE
    // ==================================================

    async setBalance(
        value
    ) {

        await this.ready;


        const balance =
            Number(value);


        if (
            !Number.isFinite(balance) ||
            balance < 0
        ) {

            return false;

        }


        this.balance =
            balance;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // ADD BALANCE
    // ==================================================

    async addBalance(
        amount
    ) {

        await this.ready;


        const value =
            Number(amount);


        if (
            !Number.isFinite(value)
        ) {

            return false;

        }


        this.balance +=
            value;


        if (
            this.balance < 0
        ) {

            this.balance =
                0;

        }


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // RESERVE MARGIN
    // ==================================================

    async reserveMargin(
        amount
    ) {

        await this.ready;


        const margin =
            Number(amount);


        if (
            !Number.isFinite(margin) ||
            margin <= 0
        ) {

            return false;

        }


        this.normalizeState();


        if (
            margin >
            this.availableBalance
        ) {

            return false;

        }


        this.usedMargin +=
            margin;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // RELEASE MARGIN
    // ==================================================

    async releaseMargin(
        amount
    ) {

        await this.ready;


        const margin =
            Number(amount);


        if (
            !Number.isFinite(margin) ||
            margin < 0
        ) {

            return false;

        }


        this.usedMargin -=
            margin;


        if (
            this.usedMargin < 0
        ) {

            this.usedMargin =
                0;

        }


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // UPDATE UNREALIZED PNL
    // ==================================================

    async updateUnrealizedPnL(
        value
    ) {

        await this.ready;


        const pnl =
            Number(value);


        if (
            !Number.isFinite(pnl)
        ) {

            return false;

        }


        this.unrealizedPnL =
            pnl;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // SET REALIZED PNL
    // ==================================================

    async setRealizedPnL(
        value
    ) {

        await this.ready;


        const pnl =
            Number(value);


        if (
            !Number.isFinite(pnl)
        ) {

            return false;

        }


        this.realizedPnL =
            pnl;


        this.normalizeState();


        return await this.persist();

    }
    // ==================================================
    // APPLY CLOSED TRADE SETTLEMENT (GROSS PNL + FEES)
    // Atomically updates balance, realized PnL and fees.
    // ==================================================

    async applyTradeSettlement(grossPnlValue, feeValue) {

        await this.ready;

        const grossPnl = Number(grossPnlValue);
        const fees = Number(feeValue);

        if (
            !Number.isFinite(grossPnl) ||
            !Number.isFinite(fees) ||
            fees < 0
        ) {
            return false;
        }

        const netPnl = grossPnl - fees;

        this.balance += netPnl;
        this.realizedPnL += netPnl;
        this.tradingFees += fees;
        this.unrealizedPnL = 0;

        this.normalizeState();

        return await this.persist();
    }






    // ==================================================
    // APPLY REALIZED PNL
    // ==================================================

    async applyRealizedPnL(
        value
    ) {

        await this.ready;


        const pnl =
            Number(value);


        if (
            !Number.isFinite(pnl)
        ) {

            return false;

        }


        this.balance +=
            pnl;


        this.realizedPnL +=
            pnl;


        this.unrealizedPnL =
            0;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // APPLY FEE
    // ==================================================

    async applyFee(
        value
    ) {

        await this.ready;


        const fee =
            Number(value);


        if (
            !Number.isFinite(fee) ||
            fee < 0
        ) {

            return false;

        }


        this.balance -=
            fee;


        this.realizedPnL -=
            fee;


        this.tradingFees +=
            fee;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // APPLY FUNDING FEE
    // ==================================================

    async applyFundingFee(
        value
    ) {

        await this.ready;


        const fee =
            Number(value);


        if (
            !Number.isFinite(fee) ||
            fee < 0
        ) {

            return false;

        }


        this.balance -=
            fee;


        this.realizedPnL -=
            fee;


        this.fundingFees +=
            fee;


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // REGISTER CLOSED TRADE
    //
    // این متد فقط برای آمار Trade بسته‌شده است.
    //
    // PnL نباید دوباره اینجا به Balance اضافه شود.
    // PnL باید قبل از این متد توسط
    // applyRealizedPnL ثبت شده باشد.
    // ==================================================

    async registerClosedTrade(
        pnl
    ) {

        await this.ready;


        const value =
            Number(pnl);


        if (
            !Number.isFinite(value)
        ) {

            return false;

        }


        // ==============================================
        // هر Close فقط یک Trade
        // ==============================================

        this.totalTrades +=
            1;


        // ==============================================
        // WIN
        // ==============================================

        if (
            value > 0
        ) {

            this.winningTrades +=
                1;

            this.consecutiveWins +=
                1;

            this.consecutiveLosses =
                0;


            this.grossProfit +=
                value;


            if (
                value >
                this.largestProfit
            ) {

                this.largestProfit =
                    value;

            }

        }


        // ==============================================
        // LOSS
        // ==============================================

        else if (
            value < 0
        ) {

            this.losingTrades +=
                1;

            this.consecutiveLosses +=
                1;

            this.consecutiveWins =
                0;


            const loss =
                Math.abs(
                    value
                );


            this.grossLoss +=
                loss;


            if (
                loss >
                this.largestLoss
            ) {

                this.largestLoss =
                    loss;

            }

        }


        // ==============================================
        // BREAKEVEN
        // ==============================================

        else {

            // Trade ثبت می‌شود
            // اما Win یا Loss نیست.

        }


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // UPDATE PERIOD PNL
    // ==================================================

    async setPeriodPnL({

        todayPnl,
        weeklyPnl,
        monthlyPnl

    } = {}) {

        await this.ready;


        if (
            todayPnl !== undefined
        ) {

            this.todayPnl =
                this.toNumber(
                    todayPnl,
                    this.todayPnl
                );

        }


        if (
            weeklyPnl !== undefined
        ) {

            this.weeklyPnl =
                this.toNumber(
                    weeklyPnl,
                    this.weeklyPnl
                );

        }


        if (
            monthlyPnl !== undefined
        ) {

            this.monthlyPnl =
                this.toNumber(
                    monthlyPnl,
                    this.monthlyPnl
                );

        }


        this.normalizeState();


        return await this.persist();

    }



    // ==================================================
    // GET STATE
    // ==================================================

    getState() {

        this.normalizeState();


        return {

            accountId:
                this.accountId,

            exchange:
                this.exchange,

            currency:
                this.currency,

            initialBalance:
                this.initialBalance,

            balance:
                this.balance,

            equity:
                this.equity,

            availableBalance:
                this.availableBalance,

            usedMargin:
                this.usedMargin,

            positionExposure:
                this.positionExposure,

            unrealizedPnL:
                this.unrealizedPnL,

            realizedPnL:
                this.realizedPnL,

            totalPnl:
                this.totalPnl,

            pnl:
                this.totalPnl,

            todayPnl:
                this.todayPnl,

            weeklyPnl:
                this.weeklyPnl,

            monthlyPnl:
                this.monthlyPnl,

            // ==========================================
            // CAPITAL FLOW
            // ==========================================

            depositTotal:
                this.depositTotal,

            withdrawalTotal:
                this.withdrawalTotal,

            // ==========================================
            // FEES
            // ==========================================

            tradingFees:
                this.tradingFees,

            fees:
                this.tradingFees,

            fundingFees:
                this.fundingFees,

            // ==========================================
            // TRADING STATISTICS
            // ==========================================

            totalTrades:
                this.totalTrades,

            winningTrades:
                this.winningTrades,

            losingTrades:
                this.losingTrades,

            winRate:
                this.winRate,

            profitFactor:
                this.profitFactor,

            averageProfit:
                this.averageProfit,

            averageLoss:
                this.averageLoss,

            largestProfit:
                this.largestProfit,

            largestLoss:
                this.largestLoss,

            consecutiveWins:
                this.consecutiveWins,

            consecutiveLosses:
                this.consecutiveLosses,

            // ==========================================
            // INTERNAL GROSS STATISTICS
            // ==========================================

            grossProfit:
                this.grossProfit,

            grossLoss:
                this.grossLoss,

            // ==========================================
            // STATUS
            // ==========================================

            status:
                this.status

        };

    }



    // ==================================================
    // PERSIST
    // ==================================================

    async persist() {

        try {

            await this.ready;

            await PaperAccountStore.ready;


            const account =
                PaperAccountStore.getByAccountId(
                    this.accountId
                );


            if (!account) {

                console.error(
                    "❌ PAPER ACCOUNT PERSIST ERROR: ACCOUNT NOT FOUND"
                );

                return false;

            }


            this.normalizeState();


            await PaperAccountStore.update(

                account.id,

                {

                    initialBalance:
                        this.initialBalance,

                    balance:
                        this.balance,

                    equity:
                        this.equity,

                    availableBalance:
                        this.availableBalance,

                    usedMargin:
                        this.usedMargin,

                    positionExposure:
                        this.positionExposure,

                    unrealizedPnl:
                        this.unrealizedPnL,

                    realizedPnl:
                        this.realizedPnL,

                    totalPnl:
                        this.totalPnl,

                    fees:
                        this.tradingFees,

                    fundingFees:
                        this.fundingFees,

                    depositTotal:
                        this.depositTotal,

                    withdrawalTotal:
                        this.withdrawalTotal,

                    totalTrades:
                        this.totalTrades,

                    winningTrades:
                        this.winningTrades,

                    losingTrades:
                        this.losingTrades,

                    winRate:
                        this.winRate,

                    profitFactor:
                        this.profitFactor,

                    averageProfit:
                        this.averageProfit,

                    averageLoss:
                        this.averageLoss,

                    largestProfit:
                        this.largestProfit,

                    largestLoss:
                        this.largestLoss,

                    consecutiveWins:
                        this.consecutiveWins,

                    consecutiveLosses:
                        this.consecutiveLosses,

                    todayPnl:
                        this.todayPnl,

                    weeklyPnl:
                        this.weeklyPnl,

                    monthlyPnl:
                        this.monthlyPnl,

                    status:
                        this.status

                }

            );


            return true;

        }
        catch (error) {

            console.error(

                "❌ PAPER ACCOUNT PERSIST ERROR:",

                error?.message ||
                error

            );


            return false;

        }

    }



    // ==================================================
    // RESET
    // ==================================================

    async reset(
        balance = 10000
    ) {

        await this.ready;


        const value =
            Number(balance);


        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            return false;

        }


        // ==============================================
        // ACCOUNT
        // ==============================================

        this.initialBalance =
            value;

        this.balance =
            value;

        this.equity =
            value;

        this.availableBalance =
            value;

        this.usedMargin =
            0;

        this.positionExposure =
            0;


        // ==============================================
        // PNL
        // ==============================================

        this.unrealizedPnL =
            0;

        this.realizedPnL =
            0;

        this.totalPnl =
            0;


        // ==============================================
        // FEES
        // ==============================================

        this.tradingFees =
            0;

        this.fundingFees =
            0;


        // ==============================================
        // CAPITAL FLOW
        // ==============================================

        this.depositTotal =
            value;

        this.withdrawalTotal =
            0;


        // ==============================================
        // TRADING STATISTICS
        // ==============================================

        this.totalTrades =
            0;

        this.winningTrades =
            0;

        this.losingTrades =
            0;

        this.winRate =
            0;

        this.profitFactor =
            0;

        this.averageProfit =
            0;

        this.averageLoss =
            0;

        this.largestProfit =
            0;

        this.largestLoss =
            0;

        this.consecutiveWins =
            0;

        this.consecutiveLosses =
            0;


        // ==============================================
        // INTERNAL STATISTICS
        // ==============================================

        this.grossProfit =
            0;

        this.grossLoss =
            0;


        // ==============================================
        // PERIOD PNL
        // ==============================================

        this.todayPnl =
            0;

        this.weeklyPnl =
            0;

        this.monthlyPnl =
            0;


        // ==============================================
        // STATUS
        // ==============================================

        this.status =
            "ACTIVE";


        this.normalizeState();


        return await this.persist();

    }

}


// ======================================================
// SINGLETON
// ======================================================

export default new PaperTradingManager();

