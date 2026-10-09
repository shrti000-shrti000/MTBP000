// ======================================================
// backend/risk/PositionMonitor.js
// ======================================================

import PositionStore from "./PositionStore.js";

import PositionCloser from "./PositionCloser.js";

import PaperTradingManager from "../config/PaperTradingManager.js";


// ======================================================
// MTBP
// Position Monitor
//
// مسئول:
// - Monitor کردن Position های OPEN
// - محاسبه Unrealized PnL برای Paper
// - محاسبه Position Exposure برای Paper
// - Sync کردن PaperTradingManager
// - بررسی Stop Loss / Take Profit / Trailing Stop
//
// نکته:
// Trailing Stop در PositionStore.updatePrice()
// مدیریت می‌شود تا SL فقط در جهت محافظتی حرکت کند.
//
// LONG:
// SL فقط می‌تواند بالاتر برود.
//
// SHORT:
// SL فقط می‌تواند پایین‌تر برود.
// ======================================================


class PositionMonitor {


    // ==================================================
    // CALCULATE POSITION PNL
    // ==================================================

    static calculatePnL(position) {

        if (!position) {

            return 0;

        }


        const entryPrice =
            Number(
                position.entryPrice
            );


        const currentPrice =
            Number(
                position.currentPrice
            );


        const quantity =
            Number(
                position.quantity
            );


        if (
            !Number.isFinite(entryPrice) ||
            !Number.isFinite(currentPrice) ||
            !Number.isFinite(quantity)
        ) {

            return 0;

        }


        if (
            entryPrice <= 0 ||
            currentPrice <= 0 ||
            quantity <= 0
        ) {

            return 0;

        }


        // ==============================================
        // LONG
        // ==============================================

        const normalizedSide =
            String(position.side ?? "")
                .trim()
                .toUpperCase();

        if (
            normalizedSide === "LONG" ||
            normalizedSide === "BUY_OPEN"
        ) {

            return (
                currentPrice -
                entryPrice
            ) * quantity;

        }


        // ==============================================
        // SHORT
        // ==============================================

        if (
            normalizedSide === "SHORT" ||
            normalizedSide === "SELL_OPEN"
        ) {

            return (
                entryPrice -
                currentPrice
            ) * quantity;

        }


        return 0;

    }



    // ==================================================
    // CALCULATE POSITION EXPOSURE
    // ==================================================

    static calculateExposure(position) {

        if (!position) {

            return 0;

        }


        const entryPrice =
            Number(
                position.entryPrice
            );


        const quantity =
            Number(
                position.quantity
            );


        if (
            !Number.isFinite(entryPrice) ||
            !Number.isFinite(quantity)
        ) {

            return 0;

        }


        if (
            entryPrice <= 0 ||
            quantity <= 0
        ) {

            return 0;

        }


        return (
            entryPrice *
            quantity
        );

    }



    // ==================================================
    // UPDATE PAPER ACCOUNT
    // ==================================================

    static async updatePaperAccount(
        positions
    ) {

        try {

            await PaperTradingManager
                .waitUntilReady();


            // ==========================================
            // فقط PAPER POSITION ها
            // ==========================================

            const paperPositions =
                positions.filter(

                    position =>

                        String(
                            position.mode ?? "PAPER"
                        )
                        .toUpperCase() ===
                        "PAPER"

                );


            // ==========================================
            // TOTAL UNREALIZED PNL
            // ==========================================

            let totalUnrealizedPnL = 0;


            // ==========================================
            // TOTAL EXPOSURE
            // ==========================================

            let totalExposure = 0;


            for (
                const position
                of paperPositions
            ) {

                const pnl =
                    this.calculatePnL(
                        position
                    );


                const exposure =
                    this.calculateExposure(
                        position
                    );


                totalUnrealizedPnL +=
                    pnl;


                totalExposure +=
                    exposure;


                // ======================================
                // نگهداری PnL روی خود Position
                // ======================================

                position.unrealizedPnL =
                    pnl;


                position.pnl = {

                    value:
                        pnl,

                    percent:
                        exposure > 0
                            ? (
                                pnl /
                                exposure
                            ) * 100
                            : 0

                };


                await PositionStore.update({

                    ...position

                });

            }


            // ==========================================
            // SYNC PAPER ACCOUNT
            // ==========================================

            await PaperTradingManager
                .updateUnrealizedPnL(
                    totalUnrealizedPnL
                );


            return {

                unrealizedPnL:
                    totalUnrealizedPnL,

                exposure:
                    totalExposure,

                count:
                    paperPositions.length

            };

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT MONITOR SYNC ERROR:",
                error?.message ||
                error
            );


            return null;

        }

    }



    // ==================================================
    // CHECK WHETHER CURRENT STOP IS TRAILING STOP
    // ==================================================

    static isTrailingStop(position) {

        if (!position) {

            return false;

        }


        const trailing =
            position.trailing;


        if (
            !trailing ||
            trailing.active !== true
        ) {

            return false;

        }


        const currentStopLoss =
            Number(
                position.stopLoss
            );


        const trailingStopPrice =
            Number(
                trailing.stopPrice
            );


        if (
            !Number.isFinite(currentStopLoss) ||
            !Number.isFinite(trailingStopPrice)
        ) {

            return false;

        }


        if (
            currentStopLoss <= 0 ||
            trailingStopPrice <= 0
        ) {

            return false;

        }


        // ==================================================
        // PositionStore زمانی که Trailing واقعاً به عنوان
        // Stop Loss اعمال شود، stopLoss را روی trailing
        // stopPrice قرار می‌دهد.
        //
        // برای جلوگیری از مشکل اختلاف اعشاری، مقایسه
        // با tolerance انجام می‌شود.
        // ==================================================

        const difference =
            Math.abs(
                currentStopLoss -
                trailingStopPrice
            );


        const tolerance =
            Math.max(
                1e-8,
                Math.abs(
                    currentStopLoss
                ) * 1e-8
            );


        return (
            difference <=
            tolerance
        );

    }



    // ==================================================
    // DETERMINE STOP CLOSE REASON
    // ==================================================

    static determineStopCloseReason(position) {

        if (
            this.isTrailingStop(
                position
            )
        ) {

            return "TRAILING_STOP";

        }


        return "STOP_LOSS";

    }



    // ==================================================
    // UPDATE MONITOR
    // ==================================================

    static async update() {


        // ==============================================
        // GET OPEN POSITIONS
        // ==============================================

        const positions =
            PositionStore
                .getOpenPositions();


        // ==============================================
        // PAPER ACCOUNT SYNC
        //
        // Unrealized PnL تمام Position های Paper
        // محاسبه می‌شود.
        // ==============================================

        await this.updatePaperAccount(
            positions
        );


        // ==============================================
        // POSITION MONITOR
        // ==============================================

        for (
            const position
            of positions
        ) {


            try {


                // ==================================================
                // TRAILING STOP
                //
                // Trailing Stop در PositionStore.updatePrice()
                // محاسبه و ذخیره می‌شود.
                //
                // اینجا دیگر نباید دوباره محاسبه شود و
                // stopLoss مستقیماً overwrite شود.
                //
                // ==================================================


                // ==================================================
                // EXIT CHECK
                // ==================================================

                let closeReason =
                    null;


                // ==================================================
                // LONG
                // ==================================================

                const normalizedSide =
                    String(position.side ?? "")
                        .trim()
                        .toUpperCase();

                if (
                    normalizedSide === "LONG" ||
                    normalizedSide === "BUY_OPEN"
                ) {


                    if (

                        position.stopLoss &&

                        position.currentPrice <=
                        position.stopLoss

                    ) {

                        closeReason =
                            this.determineStopCloseReason(
                                position
                            );

                    }


                    else if (

                        position.takeProfit &&

                        position.currentPrice >=
                        position.takeProfit

                    ) {

                        closeReason =
                            "TAKE_PROFIT";

                    }

                }


                // ==================================================
                // SHORT
                // ==================================================

                else if (
                    normalizedSide === "SHORT" ||
                    normalizedSide === "SELL_OPEN"
                ) {


                    if (

                        position.stopLoss &&

                        position.currentPrice >=
                        position.stopLoss

                    ) {

                        closeReason =
                            this.determineStopCloseReason(
                                position
                            );

                    }


                    else if (

                        position.takeProfit &&

                        position.currentPrice <=
                        position.takeProfit

                    ) {

                        closeReason =
                            "TAKE_PROFIT";

                    }

                }


                // ==================================================
                // EXECUTE CLOSE
                // ==================================================

                if (
                    closeReason
                ) {


                    await PositionCloser.close(

                        position,

                        closeReason

                    );

                }


            }
            catch (error) {


                console.error(

                    "❌ POSITION MONITOR ERROR:",

                    error?.message ||
                    error

                );

            }


        }


    }


}


// ======================================================
// EXPORT
// ======================================================

export default PositionMonitor;