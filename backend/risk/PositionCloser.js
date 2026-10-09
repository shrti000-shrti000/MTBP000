import PositionStore from "./PositionStore.js";
import PaperTradingManager from "../config/PaperTradingManager.js";
import OrderExecutor from "../execution/OrderExecutor.js";
import LiveTradingManager from "../config/LiveTradingManager.js";
import RiskStore from "./RiskStore.js";
import AccountStore from "../account/AccountStore.js";
import riskSettings from "../config/riskSettings.js";

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

    constructor() {
        // Prevent overlapping close attempts for the same position ID.
        this.closingPositions = new Set();

        // Retain completed Paper-close stages across retries in this process.
        // This prevents a persistence failure from applying the same settlement twice.
        this.paperCloseAttempts = new Map();
    }


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


    // Normalize side values before calculating realized PnL.
    // Older positions may use order-side aliases or inconsistent casing.
    const side =
        String(position.side ?? "")
            .trim()
            .toUpperCase();


    // ==============================================
    // LONG
    // ==============================================

    if (
        side === "LONG" ||
        side === "BUY_OPEN"
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
        side === "SHORT" ||
        side === "SELL_OPEN"
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

    // Validate before accessing position properties or acquiring the lock.
    if (!position) {
        return {
            success: false,
            error: "Position not found"
        };
    }

    if (
        position.status &&
        String(position.status).toUpperCase() !== "OPEN"
    ) {
        return {
            success: false,
            error: "Position is not OPEN"
        };
    }

    const positionId = position.id;

    if (
        positionId === undefined ||
        positionId === null ||
        String(positionId).trim() === ""
    ) {
        return {
            success: false,
            error: "Position ID is required to close safely"
        };
    }

    const closeKey = String(positionId);

    if (this.closingPositions.has(closeKey)) {
        return {
            success: false,
            error: "Position close already in progress",
            positionId
        };
    }

    this.closingPositions.add(closeKey);

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

            let closePrice =
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

            let grossPnL =
                this.calculatePnL(
                    position,
                    closePrice
                );

            const feeRate =
                Number(riskSettings.tradingFeeRate);

            if (
                !Number.isFinite(feeRate) ||
                feeRate < 0
            ) {
                return {
                    success: false,
                    mode: "PAPER",
                    error: "Invalid Paper trading fee rate"
                };
            }

            const entryNotional =
                Number(position.entryPrice) *
                Number(position.quantity);

            const exitNotional =
                closePrice *
                Number(position.quantity);

            let totalFees =
                Number(
                    (
                        (entryNotional + exitNotional) *
                        feeRate
                    ).toFixed(8)
                );

            let finalPnL =
                Number(
                    (grossPnL - totalFees).toFixed(8)
                );



            // ======================================
            // POSITION MARGIN
            // ======================================

            let positionMargin =
                this.getPositionMargin(
                    position
                );

            let closeAttempt =
                this.paperCloseAttempts.get(closeKey);

            if (!closeAttempt) {
                closeAttempt = {
                    closePrice,
                    grossPnL,
                    totalFees,
                    finalPnL,
                    positionMargin,
                    balanceBefore: PaperTradingManager.getBalance(),
                    settlementApplied: false,
                    marginReleased: false,
                    tradeRegistered: false
                };
                this.paperCloseAttempts.set(closeKey, closeAttempt);
            } else {
                // Reuse the original close snapshot so a retry cannot settle a
                // different price/PnL from the one used in the first attempt.
                closePrice = closeAttempt.closePrice;
                grossPnL = closeAttempt.grossPnL;
                totalFees = closeAttempt.totalFees;
                finalPnL = closeAttempt.finalPnL;
                positionMargin = closeAttempt.positionMargin;
            }



            // ======================================
            // APPLY REALIZED PNL
            // ======================================

            const balanceBefore = closeAttempt.balanceBefore;

            if (!closeAttempt.settlementApplied) {
                const pnlApplied =
                    await PaperTradingManager
                        .applyTradeSettlement(
                            grossPnL,
                            totalFees
                        );

                if (pnlApplied) {
                    closeAttempt.settlementApplied = true;
                }

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
            }



            // ======================================
            // RELEASE MARGIN
            // ======================================

            if (!closeAttempt.marginReleased) {
                if (positionMargin > 0) {
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

                closeAttempt.marginReleased = true;
            }



            // ======================================
            // REGISTER CLOSED TRADE
            // ======================================

            if (!closeAttempt.tradeRegistered) {
                const tradeRegistered =
                    await PaperTradingManager
                        .registerClosedTrade(
                            finalPnL
                        );

                if (tradeRegistered) {
                    closeAttempt.tradeRegistered = true;
                }

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
                    reason,
                    totalFees
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

            this.paperCloseAttempts.delete(closeKey);

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

                    pnl: finalPnL,
                    grossPnL,
                    fees: totalFees,
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
    finally {
        this.closingPositions.delete(closeKey);
    }

}


}

// ======================================================
// SINGLETON
// ======================================================

export default new PositionCloser();
