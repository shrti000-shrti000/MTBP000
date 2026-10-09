

// کد کاملا اصلاحی



// ======================================================
// MTBP
// Toobit Account Service
// ======================================================
//
// دریافت و به‌روزرسانی اطلاعات حساب LIVE
//
// Toobit
//    ↓
// AccountService
//    ↓
// LiveAccountStore
//    ↓
// live_accounts
//
// ======================================================

import LiveAccountStore
    from "../../storage/LiveAccountStore.js";


// ======================================================
// ACCOUNT SERVICE
// ======================================================

class AccountService {


    // ==================================================
    // UPDATE ACCOUNT
    // ==================================================

    async update(balance) {

        const value =
            Number(balance);


        if (
            !Number.isFinite(value)
        ) {

            return null;

        }


        // ==============================================
        // WAIT FOR DATABASE LOAD
        //
        // بسیار مهم:
        //
        // LiveAccountStore هنگام ساخت شدن،
        // اطلاعات حساب را از PostgreSQL لود می‌کند.
        //
        // قبل از getByExchange باید مطمئن شویم
        // عملیات Load تمام شده است.
        // ==============================================

        await LiveAccountStore.ready;


        // ==============================================
        // FIND EXISTING TOOBIT LIVE ACCOUNT
        // ==============================================

        let account =
            LiveAccountStore.getByExchange(
                "TOOBIT"
            );


        // ==============================================
        // CREATE ACCOUNT IF NOT EXISTS
        // ==============================================

        if (!account) {

            account =
                await LiveAccountStore.create({

                    accountId:
                        "LIVE-TOOBIT",

                    exchange:
                        "TOOBIT",

                    name:
                        "Toobit Live Account",

                    currency:
                        "USDT",

                    balance:
                        value,

                    equity:
                        value,

                    availableBalance:
                        value,

                    usedMargin:
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
                        0,

                    withdrawalTotal:
                        0,

                    assets:
                        [],

                    status:
                        "ACTIVE"

                });


            return account;

        }


        // ==============================================
        // UPDATE EXISTING ACCOUNT
        // ==============================================

        return await LiveAccountStore.update(

            account.id,

            {

                balance:
                    value,

                equity:
                    value,

                availableBalance:
                    value,

                updatedAt:
                    new Date()

            }

        );

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new AccountService();