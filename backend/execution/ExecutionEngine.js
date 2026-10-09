

//



// backend/execution/ExecutionEngine.js

import LiveTradingManager from "../config/LiveTradingManager.js";

import ExchangeStateManager
    from "../exchange/ExchangeStateManager.js";

import BotController
    from "../core/BotController.js";



class ExecutionEngine {


    constructor({ orderExecutor = null } = {}) {

        this.orderExecutor =
            orderExecutor;

    }



    // ==================================================
    // SET ORDER EXECUTOR
    // ==================================================

    setOrderExecutor(orderExecutor) {

        this.orderExecutor =
            orderExecutor;

    }



    // ==================================================
    // EXECUTE
    //
    // مسیر واحد اجرای ربات
    //
    // Signal
    //   ↓
    // RiskManager
    //   ↓
    // RiskValidator
    //   ↓
    // ExecutionEngine
    //   ↓
    // OrderExecutor
    //   ↓
    // ┌─────────────────────┐
    // │ Paper → Paper Fill  │
    // │ Live  → Exchange    │
    // └─────────────────────┘
    //
    // ExecutionEngine فقط Gateهای
    // قبل از اجرا را کنترل می‌کند.
    // تصمیم Paper / Live در OrderExecutor
    // انجام می‌شود.
    // ==================================================

    async execute(signal, riskPlan) {


        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (!signal) {

            return {

                success: false,

                error:
                    "Signal is required"

            };

        }


        if (!riskPlan) {

            return {

                success: false,

                error:
                    "Risk plan is required"

            };

        }



        // ----------------------------------------------
        // BUILD ORDER
        // ----------------------------------------------

        const order =
            this.buildOrder(
                signal,
                riskPlan
            );



        // ----------------------------------------------
        // EXCHANGE VALIDATION
        // ----------------------------------------------

        if (!order.exchange) {

            return {

                success: false,

                blocked: true,

                reason:
                    "EXCHANGE_REQUIRED",

                message:
                    "Exchange is required for execution."

            };

        }



        // ----------------------------------------------
        // BOT STATE GATE
        //
        // Paper و Live هر دو باید از Bot Gate
        // عبور کنند.
        // ----------------------------------------------

        const botStatus =
            BotController.getStatus();


        const currentBotStatus =
            String(
                botStatus?.status ||
                "STOPPED"
            )
                .trim()
                .toUpperCase();


        if (
            currentBotStatus !==
            "RUNNING"
        ) {

            return {

                success: false,

                blocked: true,

                reason:
                    `BOT_${currentBotStatus}`,

                message:
                    `Bot is ${currentBotStatus}. New trade execution is blocked.`,

                botStatus:
                    currentBotStatus,

                exchange:
                    String(
                        order.exchange
                    )
                        .toUpperCase(),

                order

            };

        }



        // ----------------------------------------------
        // EXCHANGE STATE GATE
        //
        // Paper و Live هر دو باید وضعیت Exchange
        // را بررسی کنند.
        //
        // Paper Mode باعث دور زدن Exchange Control
        // نمی‌شود.
        // ----------------------------------------------

        const exchangeTrade =
            ExchangeStateManager.canTrade(
                order.exchange
            );


        if (!exchangeTrade.allowed) {

            return {

                success: false,

                blocked: true,

                reason:
                    exchangeTrade.reason,

                message:
                    `Exchange ${String(order.exchange).toUpperCase()} is not allowed to trade.`,

                exchange:
                    String(order.exchange)
                        .toUpperCase(),

                order

            };

        }



        // ----------------------------------------------
        // EMERGENCY STOP
        //
        // Emergency Stop در هر دو Mode فعال است.
        // ----------------------------------------------

        if (
            LiveTradingManager.isEmergencyStop()
        ) {

            return {

                success: false,

                blocked: true,

                reason:
                    "EMERGENCY_STOP",

                message:
                    "Emergency Stop is active.",

                order

            };

        }



        // ----------------------------------------------
        // ORDER EXECUTOR VALIDATION
        //
        // Paper و Live هر دو از یک OrderExecutor
        // عبور می‌کنند.
        //
        // تصمیم Paper / Live داخل OrderExecutor
        // انجام می‌شود.
        // ----------------------------------------------

        if (!this.orderExecutor) {

            return {

                success: false,

                blocked: true,

                status:
                    "EXECUTOR_NOT_CONNECTED",

                reason:
                    "ORDER_EXECUTOR_NOT_CONNECTED",

                message:
                    "Order executor is not connected. Order was NOT executed.",

                mode:
                    LiveTradingManager.isPaperMode()
                        ? "PAPER"
                        : "LIVE",

                order

            };

        }



        // ----------------------------------------------
        // UNIFIED ORDER EXECUTION
        //
        // Paper:
        // ExecutionEngine
        //       ↓
        // OrderExecutor
        //       ↓
        // executePaperOrder()
        //
        // Live:
        // ExecutionEngine
        //       ↓
        // OrderExecutor
        //       ↓
        // Exchange Adapter
        //
        // هیچ مسیر جداگانه‌ای در اینجا وجود ندارد.
        // ----------------------------------------------

        return await this.orderExecutor.execute(
            order
        );

    }



    // ==================================================
    // BUILD STANDARD ORDER
    // ==================================================

    buildOrder(signal, riskPlan) {

        return {

            // ------------------------------------------
            // EXCHANGE
            // ------------------------------------------

            exchange:

                signal.exchange ??

                riskPlan.exchange ??

                null,



            // ------------------------------------------
            // MARKET
            // ------------------------------------------

            symbol:

                signal.symbol ??

                riskPlan.symbol ??

                null,



            // ------------------------------------------
            // ACTION
            // ------------------------------------------

            action:

                signal.action ??

                "OPEN",



            // ------------------------------------------
            // SIDE
            // ------------------------------------------

            side:

                signal.side ??

                signal.signal ??

                riskPlan.side ??

                null,



            // ------------------------------------------
            // ORDER TYPE
            // ------------------------------------------

            type:

                riskPlan.orderType ??

                "MARKET",



            // ------------------------------------------
            // QUANTITY
            // ------------------------------------------

            quantity:

                riskPlan.quantity ??

                null,



            // ------------------------------------------
            // PRICE
            //
            // برای Market Order در Paper Mode
            // از entryPrice استفاده می‌شود.
            // ------------------------------------------

            price:

                riskPlan.price ??

                riskPlan.entryPrice ??

                signal.price ??

                signal.entryPrice ??

                null,



            // ------------------------------------------
            // RISK
            // ------------------------------------------

            leverage:

                riskPlan.leverage ??

                1,


            // مقدار واقعی ریسک محاسبه‌شده توسط
            // RiskManager باید تا OrderExecutor
            // منتقل شود.
            riskAmount:

                riskPlan.riskAmount ??

                0,


            stopLoss:

                riskPlan.stopLoss ??

                null,


            takeProfit:

                riskPlan.takeProfit ??

                null,


            trailing:

                riskPlan.trailing ??

                null,


            // ------------------------------------------
            // INDICATOR / TRAILING DATA
            // ------------------------------------------

            atr:

                riskPlan.atr ??

                null,


            trailingSettings:

                riskPlan.trailingSettings ??

                null,



            // ------------------------------------------
            // SIGNAL INFORMATION
            // ------------------------------------------

            signalId:

                signal.id ??

                null,


            confidence:

                signal.confidence ??

                null,


            timeframe:

                signal.timeframe ??

                riskPlan.timeframe ??

                null,



            // ------------------------------------------
            // CREATED AT
            // ------------------------------------------

            createdAt:

                new Date()
                    .toISOString()

        };

    }

}



// ======================================================
// DEFAULT EXPORT
// ======================================================

export default new ExecutionEngine();
