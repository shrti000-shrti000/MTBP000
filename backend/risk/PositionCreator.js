

//



// backend/risk/PositionCreator.js

import PositionExecutor from "./PositionExecutor.js";


// ======================================================
// POSITION CREATOR
// ======================================================
//
// مسیر واحد ربات:
//
// OrderEventHandler
//        ↓
// PositionCreator
//        ↓
// PositionExecutor
//
// PAPER و LIVE از همین مسیر مشترک استفاده می‌کنند.
//
// تفاوت PAPER / LIVE فقط در mode سفارش است
// و باید بدون تغییر تا Position منتقل شود.
// ======================================================

class PositionCreator {


    // ==================================================
    // CREATE POSITION FROM FILLED ORDER
    // ==================================================

    async create(order) {


        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!order) {

            return {

                success: false,

                error:
                    "Order is required"

            };

        }


        // ----------------------------------------------
        // NORMALIZE MODE
        //
        // PAPER / LIVE
        // ----------------------------------------------

        const mode =
            String(
                order.mode ?? "PAPER"
            )
                .trim()
                .toUpperCase();


        const normalizedMode =
            mode === "LIVE"
                ? "LIVE"
                : "PAPER";


        // ----------------------------------------------
        // OPEN POSITION
        // ----------------------------------------------

        try {

            const position =

                await PositionExecutor.open({

                    exchange:
                        order.exchange,

                    symbol:
                        order.symbol,

                    action:
                        order.action || "OPEN",


                    // ----------------------------------
                    // TRADE PLAN
                    // ----------------------------------

                    tradePlan: {

                        allowed:
                            true,


                        side:
                            order.side,


                        entryPrice:
                            order.price,


                        quantity:
                            order.quantity,


                        leverage:
                            order.leverage ?? 1,


                        // ==================================
                        // RISK AMOUNT
                        // ==================================
                        //
                        // مقدار واقعی ریسک محاسبه‌شده توسط
                        // RiskManager باید بدون تغییر تا
                        // PositionExecutor منتقل شود.
                        //

                        riskAmount:
                            Number(
                                order.riskAmount ?? 0
                            ),


                        // ==================================
                        // IMPORTANT
                        // PAPER / LIVE
                        // ==================================

                        mode:
                            normalizedMode,


                        stopLoss:
                            order.stopLoss ?? null,


                        takeProfit:
                            order.takeProfit ?? null,


                        trailing:
                            order.trailing ?? null,


                        atr:
                            order.atr ?? null,


                        trailingSettings:
                            order.trailingSettings ?? null,


                        orderType:
                            order.type ??
                            "MARKET",


                        timeframe:
                            order.timeframe ??
                            null,


                        confidence:
                            order.confidence ??
                            null,


                        signalId:
                            order.signalId ??
                            null

                    }

                });


            // ----------------------------------------------
            // POSITION CREATION FAILED
            // ----------------------------------------------

            if (!position) {

                return null;

            }


            // ----------------------------------------------
            // RETURN CREATED POSITION
            // ----------------------------------------------

            return position;

        }
        catch (error) {

            console.error(

                "❌ POSITION CREATION ERROR:",

                error?.message ||
                error

            );

            return null;

        }

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new PositionCreator();