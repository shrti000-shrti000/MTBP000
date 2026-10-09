// ======================================================
// MTBP
// PositionExecutor
//
// مسئول:
// ایجاد Position
// Sync با RiskStore
//
// PAPER:
// Margin توسط OrderExecutor رزرو شده است.
// PositionExecutor فقط Position را ایجاد می‌کند.
//
// LIVE:
// PositionStore + RiskStore
// ======================================================

import PositionStore from "./PositionStore.js";
import RiskStore from "./RiskStore.js";



class PositionExecutor {


    // ==================================================
    // OPEN POSITION
    // ==================================================

    static async open({

        symbol,

        exchange,

        action = "OPEN",

        tradePlan,

    }) {


        // ----------------------------------------------
        // VALIDATION
        // ----------------------------------------------

        if (
            !tradePlan ||
            tradePlan.allowed !== true
        ) {

            console.error(
                "❌ POSITION REJECTED: INVALID TRADE PLAN",
                tradePlan
            );

            return null;

        }



        if (
            !symbol ||
            !tradePlan.side ||
            tradePlan.entryPrice == null ||
            tradePlan.quantity == null
        ) {

            console.error(
                "❌ POSITION REJECTED: INVALID POSITION DATA",
                {
                    symbol,
                    exchange,
                    tradePlan
                }
            );

            return null;

        }



        // ----------------------------------------------
        // TRADING MODE
        // ----------------------------------------------

        const mode =

            String(
                tradePlan.mode ?? "PAPER"
            )
            .trim()
            .toUpperCase();


        const normalizedMode =

            mode === "LIVE"
                ? "LIVE"
                : "PAPER";



        // ----------------------------------------------
        // BASIC NUMBERS
        // ----------------------------------------------

        const entryPrice =

            Number(
                tradePlan.entryPrice
            );


        const quantity =

            Number(
                tradePlan.quantity
            );


        const leverage =

            Number(
                tradePlan.leverage ?? 1
            );



        // ----------------------------------------------
        // NUMBER VALIDATION
        // ----------------------------------------------

        if (
            !Number.isFinite(entryPrice) ||
            entryPrice <= 0
        ) {

            console.error(
                "❌ INVALID ENTRY PRICE:",
                entryPrice
            );

            return null;

        }



        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            console.error(
                "❌ INVALID QUANTITY:",
                quantity
            );

            return null;

        }



        if (
            !Number.isFinite(leverage) ||
            leverage <= 0
        ) {

            console.error(
                "❌ INVALID LEVERAGE:",
                leverage
            );

            return null;

        }



        // ----------------------------------------------
        // DUPLICATE CHECK
        // ----------------------------------------------

        if (
            PositionStore.hasOpenPosition(symbol)
        ) {

            console.log(
                "⚠️ POSITION ALREADY OPEN:",
                {
                    symbol,
                    exchange
                }
            );

            return null;

        }



        // ----------------------------------------------
        // EXIT DATA
        // ----------------------------------------------

        const stopLoss =

            tradePlan.stopLoss ?? null;


        const takeProfit =

            tradePlan.takeProfit ?? null;


        const trailing =

            tradePlan.trailing ?? null;



        // ----------------------------------------------
        // NOTIONAL
        // ----------------------------------------------

        const positionNotional =

            entryPrice *
            quantity;



        // ----------------------------------------------
        // REQUIRED MARGIN
        // ----------------------------------------------

        const requiredMargin =

            positionNotional /
            leverage;



        if (
            !Number.isFinite(requiredMargin) ||
            requiredMargin <= 0
        ) {

            console.error(
                "❌ INVALID REQUIRED MARGIN:",
                requiredMargin
            );

            return null;

        }



        // ==================================================
        // PAPER
        //
        // IMPORTANT:
        //
        // OrderExecutor.executePaperOrder()
        // قبلاً Margin را رزرو کرده است.
        //
        // بنابراین اینجا نباید دوباره:
        //
        // PaperTradingManager.reserveMargin()
        //
        // اجرا شود.
        //
        // ==================================================



        // ----------------------------------------------
        // POSITION OBJECT
        // ----------------------------------------------

        const position = {

            // ------------------------------------------
            // INTERNAL
            // ------------------------------------------

            exchange:
                exchange ?? "UNKNOWN",

            symbol,

            action,


            // ------------------------------------------
            // MODE
            // ------------------------------------------

            mode:
                normalizedMode,


            // ------------------------------------------
            // STATUS
            // ------------------------------------------

            status:
                "OPEN",


            // ------------------------------------------
            // SIDE
            // ------------------------------------------

            side:
                String(
                    tradePlan.side
                )
                .trim()
                .toUpperCase(),


            // ------------------------------------------
            // ENTRY
            // ------------------------------------------

            entryPrice,

            quantity,

            leverage,


            // ------------------------------------------
            // NOTIONAL / MARGIN
            // ------------------------------------------

            positionNotional,

            requiredMargin,


            // ------------------------------------------
            // RISK
            // ------------------------------------------

            riskAmount:

                Number(
                    tradePlan.riskAmount ?? 0
                ),


            stopLoss,

            takeProfit,

            trailing,


            // ------------------------------------------
            // TRAILING
            // ------------------------------------------

            atr:
                tradePlan.atr ?? null,

            trailingSettings:
                tradePlan.trailingSettings ?? null,


            // ------------------------------------------
            // ORDER
            // ------------------------------------------

            orderType:
                tradePlan.orderType ??
                "MARKET",


            // ------------------------------------------
            // STRATEGY
            // ------------------------------------------

            timeframe:
                tradePlan.timeframe ?? null,

            confidence:
                tradePlan.confidence ?? null,

            signalId:
                tradePlan.signalId ?? null,


            // ------------------------------------------
            // TIME
            // ------------------------------------------

            openedAt:
                new Date().toISOString()

        };



        // ----------------------------------------------
        // SAVE POSITION
        // ----------------------------------------------

        let createdPosition;


        try {

            createdPosition =

                await PositionStore.add(
                    position
                );

        }
        catch (error) {

            console.error(
                "❌ POSITION STORE ADD ERROR:",
                error?.message ||
                error
            );

            return null;

        }



        // ----------------------------------------------
        // POSITION CREATION FAILED
        // ----------------------------------------------

        if (
            !createdPosition
        ) {

            console.error(
                "❌ POSITION CREATION FAILED"
            );

            return null;

        }



        // ----------------------------------------------
        // RISK STORE SYNC
        // ----------------------------------------------

        try {

            RiskStore.addPosition(
                createdPosition
            );

        }
        catch (error) {

            console.error(
                "⚠️ RISK STORE SYNC ERROR:",
                error?.message ||
                error
            );

        }



        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        console.log(
            "🟢 POSITION CREATED:",
            {
                id:
                    createdPosition.id,

                exchange:
                    createdPosition.exchange,

                symbol:
                    createdPosition.symbol,

                side:
                    createdPosition.side,

                mode:
                    createdPosition.mode,

                entryPrice:
                    createdPosition.entryPrice,

                quantity:
                    createdPosition.quantity,

                status:
                    createdPosition.status
            }
        );



        return createdPosition;

    }

}



export default PositionExecutor;