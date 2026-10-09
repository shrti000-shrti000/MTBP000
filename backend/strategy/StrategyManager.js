// backend/strategy/StrategyManager.js


import SignalEngine from "./SignalEngine.js";
import SignalMemory from "./SignalMemory.js";
import RiskManager from "../risk/RiskManager.js";
import ExecutionEngine from "../execution/ExecutionEngine.js";

import StrategyStateStore from "./StrategyStateStore.js";

import BotController from "../core/BotController.js";


import ExchangeStateManager from "../exchange/ExchangeStateManager.js";

import PaperAccountStore from "../storage/PaperAccountStore.js";

import LiveTradingManager from "../config/LiveTradingManager.js";




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