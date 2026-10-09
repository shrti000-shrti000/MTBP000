
import riskSettings from "../config/riskSettings.js";

import RiskValidator from "./RiskValidator.js";

import PositionSizer from "./PositionSizer.js";

import StopLossEngine from "./StopLossEngine.js";

import TakeProfitEngine from "./TakeProfitEngine.js";

import TrailingStopEngine from "./TrailingStopEngine.js";

import IndicatorStore from "../indicators/core/IndicatorStore.js";

class RiskManager {

   static process({

    side,

    entryPrice,

    balance,

    exchange,

    symbol,

    timeframe,

    currentPrice = entryPrice,

    highestPrice = entryPrice,

    lowestPrice = entryPrice,

}) 
    
    
    {

        // ================= RISK AMOUNT =================

        const riskAmount =
            Number(balance) *
            (
                Number(riskSettings.riskPerTrade) / 100
            );


        // ================= VALIDATION =================

        //const validation = RiskValidator.validate(balance);



      //  const validation = RiskValidator.validate(
    //balance,
   // /side
//);



        //if (!validation.allowed) {

         //   return validation;

        //}


 const validation = RiskValidator.validate(
    balance,
    side,
    riskAmount
);

if (!validation.allowed) {
    return {
        allowed: false,
        reason: validation.reason
    };
}


        const atrData =
    IndicatorStore.get(
        exchange,
        symbol,
        timeframe,
        "ATR"
    );

const atr =
    typeof atrData === "object"
        ? atrData?.value
        : atrData;





        console.log("🔎 ATR CHECK:", {
    exchange,
    symbol,
    timeframe,
    atr
});

//console.log(
  //  "🔥 RISK ATR:",
   // {
    //    exchange,
     //   symbol,
     //   timeframe,
     //   atr
   // }
//);

        // ================= STOP LOSS =================

        //const stopLossPrice =

            //StopLossEngine.calculate({

               // side,

                //entryPrice,

                //settings:

                   // riskSettings.stopLoss,

            //});


            let stopLossPrice = null;


if (
    riskSettings.stopLoss?.enabled
) {

    

    //stopLossPrice =

        //StopLossEngine.calculate({

          //  side,

          //  entryPrice,

           // settings:
           //     riskSettings.stopLoss,

        //});


       // StopLossEngine.calculate({

    //side,

    //entryPrice,

   //atr,

    //settings:
    //    riskSettings.stopLoss,

//});


          stopLossPrice =

    StopLossEngine.calculate({

        side,

        entryPrice,

        atr,

        settings:
            riskSettings.stopLoss,

    });


    

}


        // ==================================================
        // STOP LOSS DIRECTION SAFETY CHECK
        // ==================================================

        const numericEntryPrice =
            Number(entryPrice);

        const numericStopLoss =
            Number(stopLossPrice);


        if (
            Number.isFinite(numericEntryPrice) &&
            Number.isFinite(numericStopLoss)
        ) {

            // LONG:
            // Stop Loss MUST be below Entry Price

            if (
                side === "LONG" &&
                numericStopLoss >= numericEntryPrice
            ) {

                console.error(
                    "❌ INVALID LONG STOP LOSS:",
                    {
                        exchange,
                        symbol,
                        timeframe,
                        side,
                        entryPrice:
                            numericEntryPrice,
                        stopLoss:
                            numericStopLoss,
                        atr,
                        atrMultiplier:
                            riskSettings.stopLoss?.atrMultiplier
                    }
                );

                return {
                    allowed: false,
                    reason:
                        "INVALID_LONG_STOP_LOSS",
                    side,
                    entryPrice:
                        numericEntryPrice,
                    stopLoss:
                        numericStopLoss
                };

            }


            // SHORT:
            // Stop Loss MUST be above Entry Price

            if (
                side === "SHORT" &&
                numericStopLoss <= numericEntryPrice
            ) {

                console.error(
                    "❌ INVALID SHORT STOP LOSS:",
                    {
                        exchange,
                        symbol,
                        timeframe,
                        side,
                        entryPrice:
                            numericEntryPrice,
                        stopLoss:
                            numericStopLoss,
                        atr,
                        atrMultiplier:
                            riskSettings.stopLoss?.atrMultiplier
                    }
                );

                return {
                    allowed: false,
                    reason:
                        "INVALID_SHORT_STOP_LOSS",
                    side,
                    entryPrice:
                        numericEntryPrice,
                    stopLoss:
                        numericStopLoss
                };

            }

        }


        // ================= TRAILING =================

        const trailing =

    TrailingStopEngine.calculate({

        side,

        entryPrice,

        currentPrice,

        highestPrice,

        lowestPrice,

        atr,

        settings:

            riskSettings.trailing,

    });

        // ================= FINAL STOP LOSS =================

        //const finalStopLoss =

            //trailing.active

               // ? trailing.stopPrice

               // : stopLossPrice;



               const finalStopLoss =

    stopLossPrice;
        // ================= TAKE PROFIT =================

        console.log(
    "TP SETTINGS:",
    riskSettings.takeProfit
);

//const takeProfitPrice =

    ///TakeProfitEngine.calculate({

        //side,

        //entryPrice,

        //stopLossPrice:
        //    finalStopLoss,

       // settings:
       //     riskSettings.takeProfit,

    //});


    //console.log(
  // // "🔥 BEFORE TP:",
 //   {
  //      side,
  //      entryPrice,
  //      finalStopLoss,
  //      takeProfitSettings:
  //          riskSettings.takeProfit
  //  }
//);


//const takeProfitPrice =
//TakeProfitEngine.calculate({

       // side,

       // entryPrice,

       // stopLossPrice:
       //     finalStopLoss,

       // atr,

        //settings:
       //     riskSettings.takeProfit,

    //});


    const riskReferenceStop =

    finalStopLoss ??

    (
        trailing.active
            ? trailing.stopPrice
            : null
    );


const takeProfitPrice =
    TakeProfitEngine.calculate({

        side,

        entryPrice,

        stopLossPrice:
            riskReferenceStop,

        atr,

        settings:
            riskSettings.takeProfit,

    });



console.log(
    "TP RESULT:",
    takeProfitPrice
);

        // ================= POSITION SIZE =================

        //const quantity =

           // PositionSizer.calculate({

                //balance,

                //entryPrice,

                //stopLossPrice:

                //    finalStopLoss,

                //riskPercent:

                //    riskSettings.riskPerTrade,

                //leverage:

                //    riskSettings.leverage,

                //mode:

                //    riskSettings.positionMode,

                //fixedLot:

                //    riskSettings.fixedLot,

            //});



           // const quantity =

    //PositionSizer.calculate({

        //balance,

        //entryPrice,

        //stopLossPrice:

         //   finalStopLoss,


        // Risk

        //riskPercent:

        //    riskSettings.riskPerTrade,


        //leverage:

        //    riskSettings.leverage,




        // Position Size Mode

        //mode:

         //   riskSettings.positionMode,


        // FIXED MODE

        //fixedLot:

        //    riskSettings.fixedLot,


        // AUTO MODE

        //useBalancePercent:

         //   riskSettings.useBalancePercent,


        //positionSizePercent:

        //    riskSettings.positionSizePercent,


        // LIMITS

        //maxPositionSize:

        //    riskSettings.maxPositionSize,


        ///minimumOrderSize:

        //    riskSettings.minimumOrderSize,


       // minBalanceToTrade:

        //    riskSettings.minBalanceToTrade,


    //});




    const quantity =

    PositionSizer.calculate({

        balance,

        entryPrice,

        stopLossPrice:

            finalStopLoss,


        // Risk Per Trade %

        riskPerTradePercent:

            riskSettings.riskPerTrade,


        // Max Loss / Trade %

        maxLossPerTradePercent:

            riskSettings.maxLossPerTrade,


        leverage:

            riskSettings.leverage,


        // Position Size Mode

        mode:

            riskSettings.positionMode,


        // FIXED MODE

        fixedLot:

            riskSettings.fixedLot,


        // AUTO MODE

        useBalancePercent:

            riskSettings.useBalancePercent,


        positionSizePercent:

            riskSettings.positionSizePercent,


        // LIMITS

        maxPositionSize:

            riskSettings.maxPositionSize,


        minimumOrderSize:

            riskSettings.minimumOrderSize,


        minBalanceToTrade:

            riskSettings.minBalanceToTrade,

    });



        // ================= DEBUG =================

       // console.log(

        //    "RISK PLAN",

         //   {

           //     side,

           //     entryPrice,

           //     quantity,

           //     stopLoss:

           //         finalStopLoss,

           //     takeProfit:

           //         takeProfitPrice,

           //     trailing,

           // }

      //  );

        // ================= RESULT =================

        //return {

          //  allowed: true,

          //  side,

          //  entryPrice,

          //  quantity,

          //  leverage:

          //      riskSettings.leverage,

          //  stopLoss:

          //      finalStopLoss,

          //  takeProfit:

          //      takeProfitPrice,

         //   trailing,

        //};




        //return {

    //allowed: true,

    //side,

    //entryPrice,

    //quantity,


   //riskAmount:
    //riskAmount || riskSettings.riskPerTrade,

    //leverage:
     //   riskSettings.leverage,

    //stopLoss:
    //    finalStopLoss,

    //takeProfit:
     //    takeProfitPrice,

    //trailing,

//};


return {

    allowed: true,

    side,

    entryPrice,

    quantity,

    riskAmount,

    leverage:
        riskSettings.leverage,

    stopLoss:
        finalStopLoss,

    takeProfit:
        takeProfitPrice,

    trailing,

    atr,

    trailingSettings:
        riskSettings.trailing

};
    }

}

export default RiskManager;
