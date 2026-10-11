// backend/strategy/StrategyManager.js


import SignalEngine from "./SignalEngine.js";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import strategySettings from "../config/strategySettings.js";
import riskSettings from "../config/riskSettings.js";
import SignalMemory from "./SignalMemory.js";
import RiskManager from "../risk/RiskManager.js";
import ExecutionEngine from "../execution/ExecutionEngine.js";

import StrategyStateStore from "./StrategyStateStore.js";

import BotController from "../core/BotController.js";


import ExchangeStateManager from "../exchange/ExchangeStateManager.js";

import PaperAccountStore from "../storage/PaperAccountStore.js";

import LiveTradingManager from "../config/LiveTradingManager.js";




const SIGNAL_AUDIT_FILE = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../logs",
    "signal-audit.jsonl"
);

function snapshotForAudit(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return null;
    }
}

async function appendSignalAudit(record) {
    try {
        await mkdir(path.dirname(SIGNAL_AUDIT_FILE), { recursive: true });
        await appendFile(
            SIGNAL_AUDIT_FILE,
            `${JSON.stringify(record)}\n`,
            "utf8"
        );
    } catch (error) {
        // Audit logging must not crash or undo a successfully executed trade.
        console.error("❌ SIGNAL AUDIT WRITE FAILED:", error?.message || error);
    }
}

class StrategyManager {



    // ==================================================
    // PROCESS STRATEGY
    // ==================================================

    async process(

        exchange,

        symbol,

        timeframe,

        indicators,

        marketData

    ) {


 // ==================================================
// ACTIVE TRADING TIMEFRAME
// ==================================================


//console.log("🎯 STRATEGY TIMEFRAME CHECK:", timeframe);

const ACTIVE_TRADING_TIMEFRAME = "15m";

if (timeframe !== ACTIVE_TRADING_TIMEFRAME) {

    return {

        signal: "WAIT",

        side: null,

        tradePlan: null,

        execution: null,

        blocked: true,

        reason:
            `TIMEFRAME_DISABLED_${timeframe}`

    };

}




      //  console.log("🔥 STRATEGY MANAGER PROCESS:", {
   // exchange,
    //symbol,
    //timeframe,
    //signalInput: indicators,
    //marketData
//});

// ==================================================
// SIGNAL CALCULATION
// ==================================================

const signal =
    SignalEngine.calculate(
        indicators
    );

// SignalEngine previously returned no id, so signalId was null for positions.
// Assign one per calculation and retain exact entry-time inputs.
signal.id = randomUUID();
signal.generatedAt = new Date().toISOString();

const indicatorsAtSignal = snapshotForAudit(indicators);
const strategySettingsAtSignal = snapshotForAudit(strategySettings);



    if (
    exchange === "TOOBIT" &&
    symbol === "BTCUSDT" &&
    timeframe === "15m"
) {
    //console.log("🎯 BTC 15m STRATEGY:", {
     //   indicators,
     //   signal
    //});
}


   //console.log("🔥 STRATEGY SIGNAL RESULT:", {
    //exchange,
    //symbol,
    //timeframe,
    //signal: signal.signal,
    //action: signal.action,
    //buyScore: signal.buyScore,
    //sellScore: signal.sellScore,
    //buyVotes: signal.buyVotes,
    //sellVotes: signal.sellVotes,
    //confidence: signal.confidence
//});


// ==================================================
// BOT / EXCHANGE TRADE GATE
// ==================================================

const botRunning =
    BotController.isRunning();

const exchangePermission =
    ExchangeStateManager.canTrade(exchange);




   // console.log("🔥 TRADE GATE:", {
   // exchange,
   // symbol,
   // timeframe,
   // signal: signal.signal,
   // action: signal.action,
   // confidence: signal.confidence,
   // buyVotes: signal.buyVotes,
   // sellVotes: signal.sellVotes,
   // botRunning,
   // exchangeAllowed: exchangePermission.allowed,
   // exchangeReason: exchangePermission.reason
//});


// ==================================================
// BLOCK TRADE ONLY
// ==================================================

if (!botRunning) {

    return {

        ...signal,

        side: null,

        tradePlan: null,

        execution: null,

        blocked: true,

        reason:
            `BOT_${BotController.getStatus().status}`

    };

}


if (!exchangePermission.allowed) {

    return {

        ...signal,

        side: null,

        tradePlan: null,

        execution: null,

        blocked: true,

        reason:
            exchangePermission.reason

    };

}




        // ==================================================
        // CALCULATE SIGNAL
        // ==================================================

        //const signal =

           // SignalEngine.calculate(
           //     indicators
           // );

await StrategyStateStore.set(
    exchange,
    symbol,
    timeframe,
    {
        lastSignal: signal.signal,
        confidence: signal.confidence,
        buyScore: signal.buyScore,
        sellScore: signal.sellScore,
        buyVotes: signal.buyVotes,
        sellVotes: signal.sellVotes,
        updatedAt: new Date().toISOString()
    }
);



          //  console.log(
    //"🔥 STRATEGY INPUT:",
   // {
  //      exchange,
   //     symbol,
  //      timeframe,
  //      indicators,
  //      marketData
  //  }
//);



        signal.exchange =
            exchange;


        signal.symbol =
            symbol;


        signal.timeframe =
            timeframe;



        //console.log(
        //    "📡 STRATEGY SIGNAL:",
         //   {
         //       exchange,
          //      symbol,
          //      timeframe,
          //      signal
          //  }
        //);





        // ==================================================
        // DUPLICATE SIGNAL CHECK
        // ==================================================

        const lastSignal =
    await SignalMemory.get(
        exchange,
        symbol,
        timeframe
    );



        signal.isDuplicate =

            lastSignal === signal.signal;



        await SignalMemory.set(
    exchange,
    symbol,
    timeframe,
    signal.signal
);







        // ==================================================
        // SIGNAL → SIDE
        // ==================================================

        let side = null;



        if (

            signal.signal === "LONG"

        ) {

            side = "LONG";

        }



        if (

            signal.signal === "SHORT"

        ) {

            side = "SHORT";

        }



       // console.log(

         //   "🎯 STRATEGY SIDE:",

          //  side

        //);







        // ==================================================
        // RISK ENGINE
        // ==================================================

        let tradePlan = null;

        let execution = null;



        if (

            side &&

            marketData

        ) {


// ==================================================
// ACCOUNT BALANCE
// ==================================================
//
// PAPER:
// موجودی از PaperAccountStore
//
// LIVE:
// موجودی از marketData صرافی
// ==================================================

const balance =

    LiveTradingManager.isPaperMode()

        ? PaperAccountStore.getBalance()

        : Number(
            marketData.balance ?? 0
        );
        


        console.log("💰 ACCOUNT BALANCE:", {
    mode: LiveTradingManager.isPaperMode()
        ? "PAPER"
        : "LIVE",
    balance
});



// ==================================================
// RISK MANAGER
// ==================================================

tradePlan =

    RiskManager.process({

        side,

        entryPrice:
            marketData.price,

        balance,

        currentPrice:
            marketData.price,

        exchange,

        symbol,

        timeframe

    });

const riskSettingsAtPlan = snapshotForAudit({
    stopLoss: riskSettings.stopLoss,
    takeProfit: riskSettings.takeProfit,
    trailing: riskSettings.trailing,
    riskPerTrade: riskSettings.riskPerTrade,
    maxLossPerTrade: riskSettings.maxLossPerTrade,
    positionMode: riskSettings.positionMode,
    positionSizePercent: riskSettings.positionSizePercent,
    leverage: riskSettings.leverage
});

    



    console.log("🔥 RISK RESULT:", {
    exchange,
    symbol,
    timeframe,
    side,
    tradePlan
});





           // console.log(

              //  "🔥 STRATEGY TRADE PLAN:",

              //  tradePlan

           // );







            // ==================================================
            // EXECUTION ENGINE
            // ==================================================





console.log("🔍 BEFORE EXECUTION CHECK:", {
    signal: signal.signal,
    side,
    marketData,
    tradePlan
});


            if (

                tradePlan?.allowed

            ) {




                

                //console.log(

                   // "🚀 CALLING EXECUTION ENGINE:",

                   // {

                    //    exchange,

                    //    symbol,

                    //    side

                  //  }

             //   );


             console.log("🚨 REACHED EXECUTION:", {
        exchange,
        symbol,
        timeframe,
        signal: signal.signal,
        side,
        tradePlan
    });



                execution =

                    await ExecutionEngine.execute(

                        {

                            


                            


                            ...signal,


                            exchange,


                            symbol,


                            side,


                            timeframe


                        },


                        {


                            ...tradePlan,


                            exchange,


                            symbol,


                            timeframe,


                            confidence:

                                signal.confidence ?? null,


                            signalId:

                                signal.id ?? null


                        }

                    );



              console.log("🚀 EXECUTION RESULT:", {
    exchange,
    symbol,
    side,
    execution
});

if (execution?.success === true) {
    const executedPosition =
        execution.position ??
        execution.result?.position ??
        execution.order?.position ??
        null;

    await appendSignalAudit({
        schemaVersion: 1,
        event: "POSITION_OPENED",
        signalId: signal.id,
        signalGeneratedAt: signal.generatedAt,
        positionOpenedAt: new Date().toISOString(),
        exchange,
        symbol,
        timeframe,
        side,
        entryPrice: Number(marketData.price),
        indicators: indicatorsAtSignal,
        signal: {
            value: signal.signal,
            action: signal.action,
            confidence: signal.confidence ?? null,
            signalScore: signal.signalScore ?? null,
            activeWeight: signal.activeWeight ?? null,
            directionalWeight: signal.directionalWeight ?? null,
            details: snapshotForAudit(signal.details)
        },
        strategySettings: strategySettingsAtSignal,
        riskSettings: riskSettingsAtPlan,
        tradePlan: {
            allowed: tradePlan?.allowed ?? null,
            entryPrice: tradePlan?.entryPrice ?? marketData.price,
            quantity: tradePlan?.quantity ?? null,
            riskAmount: tradePlan?.riskAmount ?? null,
            stopLoss: tradePlan?.stopLoss ?? null,
            takeProfit: tradePlan?.takeProfit ?? null,
            atr: tradePlan?.atr ?? null,
            trailing: snapshotForAudit(tradePlan?.trailing),
            trailingSettings: snapshotForAudit(tradePlan?.trailingSettings)
        },
        position: {
            id: executedPosition?.id ?? null,
            positionCode: executedPosition?.positionCode ?? null,
            signalId: signal.id
        },
        execution: {
            success: execution.success,
            mode: execution.mode ?? null,
            reason: execution.reason ?? null
        }
    });
}






            //    console.log(

               //     "📦 EXECUTION RESULT:",

              //      execution

              //  );



            }


            else {


             //   console.log(

               //     "⛔ TRADE BLOCKED BY RISK:",

                 //   tradePlan

               // );


            }



        }



        else {

    console.log("⛔ TRADE BLOCKED BY RISK:", {
        signal: signal.signal,
        side,
        tradePlan
    });

}








        // ==================================================
        // RESULT
        // ==================================================

        return {


            ...signal,


            side,


            tradePlan,


            execution


        };



    }



}





export default new StrategyManager();