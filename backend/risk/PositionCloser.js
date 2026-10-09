import PositionStore from "./PositionStore.js";
import PaperTradingManager from "../config/PaperTradingManager.js";
import OrderExecutor from "../execution/OrderExecutor.js";
import LiveTradingManager from "../config/LiveTradingManager.js";
import RiskStore from "./RiskStore.js";
import AccountStore from "../account/AccountStore.js";

// ======================================================
// MTBP
// POSITION CLOSER
//
// PAPER:
// - تعیین Close Price
// - محاسبه Final PnL
// - Realized PnL
// - Release Margin
// - Trade Statistics
// - Close Position
//
// LIVE:
// - ارسال Close Order به Exchange
// - دریافت Close Price
// - Close Position
// ======================================================

class PositionCloser {


// ==================================================
// CALCULATE FINAL PNL
// ==================================================

calculatePnL(
    position,
    closePrice
) {

    if (!position) {
        return 0;
    }


    const entryPrice =
        Number(
            position.entryPrice
        );


    const price =
        Number(
            closePrice
        );


    const quantity =
        Number(
            position.quantity
        );


    if (
        !Number.isFinite(entryPrice) ||
        !Number.isFinite(price) ||
        !Number.isFinite(quantity)
    ) {

        return 0;

    }


    if (
        entryPrice <= 0 ||
        price <= 0 ||
        quantity <= 0
    ) {

        return 0;

    }


    // ==============================================
    // LONG
    // ==============================================

    if (
        position.side === "LONG" ||
        position.side === "BUY_OPEN"
    ) {

        return (
            price -
            entryPrice
        ) * quantity;

    }


    // ==============================================
    // SHORT
    // ==============================================

    if (
        position.side === "SHORT" ||
        position.side === "SELL_OPEN"
    ) {

        return (
            entryPrice -
            price
        ) * quantity;

    }


    return 0;

}



// ==================================================
// GET POSITION MARGIN
// ==================================================

getPositionMargin(
    position
) {

    if (!position) {
        return 0;
    }


    const directMargin =
        Number(
            position.margin
        );


    if (
        Number.isFinite(directMargin) &&
        directMargin > 0
    ) {

        return directMargin;

    }


    const initialMargin =
        Number(
            position.initialMargin
        );


    if (
        Number.isFinite(initialMargin) &&
        initialMargin > 0
    ) {

        return initialMargin;

    }


    const usedMargin =
        Number(
            position.usedMargin
        );


    if (
        Number.isFinite(usedMargin) &&
        usedMargin > 0
    ) {

        return usedMargin;

    }


    return 0;

}



// ==================================================
// IS PAPER POSITION
// ==================================================

isPaperPosition(
    position
) {

    if (!position) {
        return false;
    }


    return (
        String(
            position.mode ??
            "PAPER"
        )
        .trim()
        .toUpperCase() ===
        "PAPER"
    );

}



// ==================================================
// GET PAPER CLOSE PRICE
// ==================================================

getPaperClosePrice(
    position
) {

    const currentPrice =
        Number(
            position?.currentPrice
        );


    if (
        Number.isFinite(currentPrice) &&
        currentPrice > 0
    ) {

        return currentPrice;

    }


    const markPrice =
        Number(
            position?.markPrice
        );


    if (
        Number.isFinite(markPrice) &&
        markPrice > 0
    ) {

        return markPrice;

    }


    const lastPrice =
        Number(
            position?.lastPrice
        );


    if (
        Number.isFinite(lastPrice) &&
        lastPrice > 0
    ) {

        return lastPrice;

    }


    return 0;

}



// ==================================================
// CLOSE POSITION
// ==================================================

async close(
    position,
    reason = "MANUAL_CLOSE"
) {


    // ==============================================
    // VALIDATION
    // ==============================================

    if (!position) {

        return {

            success: false,

            error:
                "Position not found"

        };

    }


    if (
        position.status &&
        String(
            position.status
        ).toUpperCase() !== "OPEN"
    ) {

        return {

            success: false,

            error:
                "Position is not OPEN"

        };

    }



    try {


        // ==========================================
        // DETERMINE MODE
        // ==========================================

        const isPaper =
            this.isPaperPosition(
                position
            );



        // ==========================================
        // PAPER MODE
        // ==========================================

        if (isPaper) {


            // ======================================
            // CLOSE PRICE
            // ======================================

            const closePrice =
                this.getPaperClosePrice(
                    position
                );


            if (
                !Number.isFinite(closePrice) ||
                closePrice <= 0
            ) {

                return {

                    success: false,

                    mode:
                        "PAPER",

                    error:
                        "Invalid Paper close price"

                };

            }



            // ======================================
            // FINAL PNL
            // ======================================

            const finalPnL =
                this.calculatePnL(
                    position,
                    closePrice
                );



            // ======================================
            // POSITION MARGIN
            // ======================================

            const positionMargin =
                this.getPositionMargin(
                    position
                );



            // ======================================
            // APPLY REALIZED PNL
            // ======================================

            const balanceBefore = PaperTradingManager.getBalance();

            const pnlApplied =
                await PaperTradingManager
                    .applyRealizedPnL(
                        finalPnL
                    );


            if (!pnlApplied) {

                console.error(
                    "❌ PAPER REALIZED PNL APPLY FAILED:",
                    {
                        positionId:
                            position.id,

                        pnl:
                            finalPnL

                    }
                );


                return {

                    success: false,

                    mode:
                        "PAPER",

                    error:
                        "Failed to apply Paper realized PnL"

                };

            }



            // ======================================
            // RELEASE MARGIN
            // ======================================

            if (
                positionMargin > 0
            ) {

                const marginReleased =
                    await PaperTradingManager
                        .releaseMargin(
                            positionMargin
                        );


                if (!marginReleased) {

                    console.error(
                        "❌ PAPER MARGIN RELEASE FAILED:",
                        {
                            positionId:
                                position.id,

                            margin:
                                positionMargin

                        }
                    );


                    return {

                        success: false,

                        mode:
                            "PAPER",

                        error:
                            "Failed to release Paper margin"

                    };

                }

            }



            // ======================================
            // REGISTER CLOSED TRADE
            // ======================================

            const tradeRegistered =
                await PaperTradingManager
                    .registerClosedTrade(
                        finalPnL
                    );


            if (!tradeRegistered) {

                console.error(
                    "❌ PAPER CLOSED TRADE REGISTER FAILED:",
                    {
                        positionId:
                            position.id,

                        pnl:
                            finalPnL

                    }
                );


                return {

                    success: false,

                    mode:
                        "PAPER",

                    error:
                        "Failed to register Paper closed trade"

                };

            }



            // ======================================
            // CLOSE POSITION STORE
            // IMPORTANT:
            // PositionStore.close() IS ASYNC
            // ======================================

            const closed =
                await PositionStore.close(

                    position.id,

                    closePrice,

                    reason

                );


            if (!closed) {

                console.error(
                    "❌ POSITION STORE CLOSE FAILED:",
                    {
                        positionId:
                            position.id

                    }
                );


                return {

                    success: false,

                    mode:
                        "PAPER",

                    error:
                        "PositionStore failed to close position",

                    closePrice,

                    pnl:
                        finalPnL

                };

            }



            // ======================================
            // SUCCESS
            // ======================================

            const riskUpdated = RiskStore.recordClosedTrade(
                finalPnL,
                balanceBefore,
                PaperTradingManager.getBalance()
            );

            if (!riskUpdated) {
                console.error(
                    "❌ PAPER RISK STATE UPDATE FAILED:",
                    { positionId: position.id, pnl: finalPnL }
                );
            }

            console.log(
                "🟢 PAPER POSITION CLOSED:",
                {
                    positionId:
                        position.id,

                    closePrice,

                    pnl:
                        finalPnL,

                    marginReleased:
                        positionMargin

                }
            );


            return {

                success: true,

                position:
                    closed,

                closePrice,

                pnl:
                    finalPnL,

                reason,

                mode:
                    "PAPER"

            };

        }



        // ==========================================
        // LIVE MODE
        // ==========================================

        if (
            !LiveTradingManager
                .isPaperMode()
        ) {

            const balanceBefore = AccountStore.getBalance();

            const order = {

                exchange:
                    position.exchange,

                symbol:
                    position.symbol,

                quantity:
                    position.quantity,

                type:
                    "MARKET"

            };



            // ======================================
            // LONG CLOSE
            // ======================================

            if (
                position.side === "LONG" ||
                position.side === "BUY_OPEN"
            ) {

                order.side =
                    "SELL_CLOSE";

            }



            // ======================================
            // SHORT CLOSE
            // ======================================

            else if (
                position.side === "SHORT" ||
                position.side === "SELL_OPEN"
            ) {

                order.side =
                    "BUY_CLOSE";

            }

            else {

                return {

                    success: false,

                    error:
                        `Unsupported position side: ${position.side}`

                };

            }



            // ======================================
            // EXECUTE LIVE CLOSE
            // ======================================

            const result =
                await OrderExecutor.execute(
                    order
                );


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    error:
                        result?.error ||
                        "Close order execution failed",

                    result

                };

            }



            // ======================================
            // LIVE CLOSE PRICE
            // ======================================

            const closePrice =
                Number(
                    result.price ??
                    result.averagePrice ??
                    position.currentPrice
                );


            if (
                !Number.isFinite(closePrice) ||
                closePrice <= 0
            ) {

                return {

                    success: false,

                    error:
                        "Invalid close price"

                };

            }



            // ======================================
            // LIVE PNL
            // ======================================

            const finalPnL =
                this.calculatePnL(
                    position,
                    closePrice
                );



            // ======================================
            // CLOSE STORE
            // IMPORTANT:
            // PositionStore.close() IS ASYNC
            // ======================================

            const closed =
                await PositionStore.close(

                    position.id,

                    closePrice,

                    reason

                );


            if (!closed) {

                return {

                    success: false,

                    error:
                        "PositionStore failed to close position",

                    closePrice,

                    pnl:
                        finalPnL

                };

            }

            // AccountStore may refresh asynchronously; use the confirmed close PnL
            // to update the local risk state immediately.
            const riskUpdated = RiskStore.recordClosedTrade(
                finalPnL,
                balanceBefore,
                balanceBefore + finalPnL
            );

            if (!riskUpdated) {
                console.error(
                    "❌ LIVE RISK STATE UPDATE FAILED:",
                    {
                        positionId: position.id,
                        pnl: finalPnL,
                        balanceBefore
                    }
                );
            }

            return {

                success: true,

                position:
                    closed,

                closePrice,

                pnl:
                    finalPnL,

                reason,

                mode:
                    "LIVE"

            };

        }



        return {

            success: false,

            error:
                "Unsupported trading mode"

        };


    }
    catch (error) {


        console.error(
            "❌ POSITION CLOSE ERROR:",
            error?.message ||
            error
        );


        return {

            success: false,

            error:
                error?.message ||
                "Position close failed"

        };

    }

}


}

// ======================================================
// SINGLETON
// ======================================================

export default new PositionCloser();
