
// ======================================================
// MTBP
// PAPER ACCOUNT ROUTES
// ======================================================

import express from "express";

import PaperTradingManager
    from "../config/PaperTradingManager.js";

import PaperAccountStore
    from "../storage/PaperAccountStore.js";


const router = express.Router();


// ======================================================
// PAPER ACCOUNT
// GET /api/paper/account
// ======================================================

router.get(
    "/",
    async (req, res) => {

        try {

            // ==============================================
            // WAIT FOR PAPER ACCOUNT SYSTEM
            // ==============================================

            await PaperTradingManager
                .waitUntilReady();

            await PaperAccountStore
                .ready;


            // ==============================================
            // GET CURRENT ACCOUNT DIRECTLY FROM STORE
            //
            // IMPORTANT:
            //
            // PositionStore.syncPaperAccount()
            // اطلاعات لحظه‌ای حساب را در PaperAccountStore
            // به‌روزرسانی می‌کند.
            //
            // بنابراین API باید همین Account را برگرداند
            // و نه State قدیمی PaperTradingManager.
            // ==============================================

            const exchange =
                PaperTradingManager.exchange ??
                "toobit";


            const account =
                PaperAccountStore.getByExchange(
                    exchange
                );


            // ==============================================
            // ACCOUNT NOT FOUND
            // ==============================================

            if (!account) {

                console.error(
                    "❌ PAPER ACCOUNT API: ACCOUNT NOT FOUND",
                    {
                        exchange
                    }
                );


                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Paper account not found"

                    });

            }


            // ==============================================
            // RETURN CURRENT ACCOUNT
            // ==============================================

            return res.json({

                success: true,

                account: {

                    // ======================================
                    // ACCOUNT
                    // ======================================

                    accountId:
                        account.accountId,

                    exchange:
                        account.exchange,

                    currency:
                        account.currency,

                    initialBalance:
                        Number(
                            account.initialBalance ?? 0
                        ),

                    balance:
                        Number(
                            account.balance ?? 0
                        ),

                    equity:
                        Number(
                            account.equity ?? 0
                        ),

                    availableBalance:
                        Number(
                            account.availableBalance ?? 0
                        ),

                    usedMargin:
                        Number(
                            account.usedMargin ?? 0
                        ),

                    positionExposure:
                        Number(
                            account.positionExposure ?? 0
                        ),


                    // ======================================
                    // PNL
                    // ======================================

                    unrealizedPnl:
                        Number(
                            account.unrealizedPnl ?? 0
                        ),

                    // Compatibility with existing frontend
                    unrealizedPnL:
                        Number(
                            account.unrealizedPnl ?? 0
                        ),

                    realizedPnl:
                        Number(
                            account.realizedPnl ?? 0
                        ),

                    // Compatibility with existing frontend
                    realizedPnL:
                        Number(
                            account.realizedPnl ?? 0
                        ),

                    totalPnl:
                        Number(
                            account.totalPnl ?? 0
                        ),

                    // Compatibility
                    pnl:
                        Number(
                            account.totalPnl ?? 0
                        ),


                    // ======================================
                    // PERIOD PNL
                    // ======================================

                    todayPnl:
                        Number(
                            account.todayPnl ?? 0
                        ),

                    weeklyPnl:
                        Number(
                            account.weeklyPnl ?? 0
                        ),

                    monthlyPnl:
                        Number(
                            account.monthlyPnl ?? 0
                        ),


                    // ======================================
                    // CAPITAL FLOW
                    // ======================================

                    depositTotal:
                        Number(
                            account.depositTotal ?? 0
                        ),

                    withdrawalTotal:
                        Number(
                            account.withdrawalTotal ?? 0
                        ),


                    // ======================================
                    // FEES
                    // ======================================

                    tradingFees:
                        Number(
                            account.tradingFees ??
                            account.fees ??
                            0
                        ),

                    fees:
                        Number(
                            account.fees ??
                            account.tradingFees ??
                            0
                        ),

                    fundingFees:
                        Number(
                            account.fundingFees ?? 0
                        ),


                    // ======================================
                    // TRADING STATISTICS
                    // ======================================

                    totalTrades:
                        Number(
                            account.totalTrades ?? 0
                        ),

                    winningTrades:
                        Number(
                            account.winningTrades ?? 0
                        ),

                    losingTrades:
                        Number(
                            account.losingTrades ?? 0
                        ),

                    winRate:
                        Number(
                            account.winRate ?? 0
                        ),

                    profitFactor:
                        Number(
                            account.profitFactor ?? 0
                        ),

                    averageProfit:
                        Number(
                            account.averageProfit ?? 0
                        ),

                    averageLoss:
                        Number(
                            account.averageLoss ?? 0
                        ),

                    largestProfit:
                        Number(
                            account.largestProfit ?? 0
                        ),

                    largestLoss:
                        Number(
                            account.largestLoss ?? 0
                        ),

                    consecutiveWins:
                        Number(
                            account.consecutiveWins ?? 0
                        ),

                    consecutiveLosses:
                        Number(
                            account.consecutiveLosses ?? 0
                        ),

                    grossProfit:
                        Number(
                            account.grossProfit ?? 0
                        ),

                    grossLoss:
                        Number(
                            account.grossLoss ?? 0
                        ),


                    // ======================================
                    // OTHER
                    // ======================================

                    assets:
                        account.assets ?? [],

                    status:
                        account.status ?? "ACTIVE"

                }

            });

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT API ERROR:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error?.message ||
                        "Paper account API error"

                });

        }

    }
);


// ======================================================
// RESET PAPER ACCOUNT
// POST /api/paper/account/reset
// ======================================================

router.post(
    "/reset",
    async (req, res) => {

        try {

            await PaperTradingManager
                .waitUntilReady();


            await PaperAccountStore
                .ready;


            // ==============================================
            // DEFAULT PAPER BALANCE
            // ==============================================

            const balance =
                req.body?.balance ?? 10000;


            // ==============================================
            // VALIDATION
            // ==============================================

            const numericBalance =
                Number(balance);


            if (
                !Number.isFinite(
                    numericBalance
                ) ||
                numericBalance < 0
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Invalid paper account balance"

                    });

            }


            // ==============================================
            // RESET
            // ==============================================

            const success =
                await PaperTradingManager.reset(
                    numericBalance
                );


            if (!success) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Paper account reset failed"

                    });

            }


            // ==============================================
            // READ FRESH ACCOUNT FROM STORE
            // ==============================================

            const exchange =
                PaperTradingManager.exchange ??
                "toobit";


            const account =
                PaperAccountStore.getByExchange(
                    exchange
                );


            // ==============================================
            // RESULT
            // ==============================================

            return res.json({

                success: true,

                account:
                    account

            });

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT RESET ERROR:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error?.message ||
                        "Paper account reset error"

                });

        }

    }
);


export default router;

