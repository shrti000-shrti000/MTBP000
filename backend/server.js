

import ExecutionEngine from "./execution/ExecutionEngine.js";
import OrderStore from "./storage/OrderStore.js";
import OrderExecutor from "./execution/OrderExecutor.js";

import express from "express";
import cors from "cors";
import http from "http";

import { ExchangeManager } from "./exchange/exchangeManager.js";
import { createWSServer } from "./wsServer.js";
import { marketStore } from "./core/marketStore.js";

import strategySettings from "./config/strategySettings.js";
import riskSettings from "./config/riskSettings.js";

import IndicatorManager from "./indicators/core/IndicatorManager.js";

import ActiveSymbolsStore from "./filter/ActiveSymbolsStore.js";

import PositionStore from "./risk/PositionStore.js";
import PositionExecutor from "./risk/PositionExecutor.js";

import PositionMonitor from "./risk/PositionMonitor.js";

import RiskManager from "./risk/RiskManager.js";

import IndicatorStore from "./indicators/core/IndicatorStore.js";

import IndicatorCache from "./indicators/core/IndicatorCache.js";

import RiskStore from "./risk/RiskStore.js";


import PaperTradingManager from "./config/PaperTradingManager.js";



import BotController from "./core/BotController.js";
import ExchangeStateManager from "./exchange/ExchangeStateManager.js";

import StrategyStateStore from "./strategy/StrategyStateStore.js";

import StrategySettingsStore from "./strategy/StrategySettingsStore.js";

import tradingModeRoutes from "./core/tradingModeRoutes.js";

import paperAccountRoutes from "./api/paperAccountRoutes.js";

import PositionCloser from "./risk/PositionCloser.js";

import IndicatorDispatcher from "./indicators/IndicatorDispatcher.js";




//console.log(
 //   "🔥 SERVER POSITION STORE:",
 //   PositionStore
//);



const app = express();

let exchangeManager = null;



app.use(
    cors()
);

app.use(
    express.json()
);


// ========================================
// TRADING MODE
// ========================================

app.use(
    "/api/trading-mode",
    tradingModeRoutes
);




// ========================================
// PAPER ACCOUNT API
// ========================================

app.use(
    "/api/paper/account",
    paperAccountRoutes
);



app.use(
    (req, res, next) => {

       // console.log(
         //   "📡 REQUEST:",
          //  req.method,
          //  req.url
       // );

        next();

    }
);



const server =
    http.createServer(app);



// ========================================
// ROOT
// ========================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "🚀 MTBP Running"
        );

    }
);



// ========================================
// COINS
// ========================================

app.get(
    "/coins",
    (req, res) => {

        res.json({

            coins:
                ActiveSymbolsStore.getSymbols()

        });

    }
);


// ========================================
// STRATEGY SETTINGS
// ========================================

app.get(
    "/api/strategy/settings",
    (req, res) => {

        res.json(
            strategySettings
        );

    }
);

app.post(
    "/api/strategy/settings",
    async (req, res) => {

        try {

            // ========================================
            // UPDATE RUNTIME SETTINGS
            // ========================================

            Object.assign(
                strategySettings,
                req.body
            );


         //   console.log(
    //"🔥 SETTINGS RECEIVED FROM FRONTEND:",
    //JSON.stringify(
    //    req.body,
     //   null,
     //   2
   // )
//);


            console.log(
    "🔥 SETTINGS AFTER FRONTEND REQUEST:",
    JSON.stringify(
        strategySettings,
        null,
        2
    )
);


            // ========================================
            // PERSIST STRATEGY SETTINGS
            // ========================================

            const savedSettings =
                await StrategySettingsStore.set(
                    strategySettings
                );


            // ========================================
            // SYNC RUNTIME OBJECT
            // ========================================

            Object.assign(
                strategySettings,
                savedSettings
            );


            // ========================================
            // CLEAR INDICATOR CACHE
            // ========================================

          //  IndicatorManager.clear();


          //  return res.json({

           //     success: true,

          //      settings:
           //         strategySettings

          //});


// RESET INDICATOR ENGINE
IndicatorDispatcher.clear();

// REBUILD INDICATORS FROM EXISTING CANDLE HISTORY
if (exchangeManager) {
    await exchangeManager.rebuildIndicators();
}

return res.json({
    success: true,
    settings: strategySettings
});

        }
        catch (error) {

            console.error(
                "❌ STRATEGY SETTINGS SAVE ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);

// ========================================
// RISK SETTINGS
// ========================================

app.get(
    "/api/risk/settings",
    (req, res) => {

        res.json(
            riskSettings
        );

    }
);


app.post(
    "/api/risk/settings",
    (req, res) => {

        const body = req.body;


        // ========================================
// POSITION MANAGEMENT UPDATE
// ========================================

riskSettings.positionMode =
    body.positionMode ?? 
    riskSettings.positionMode;


riskSettings.positionSizePercent =
    body.positionSizePercent ??
    riskSettings.positionSizePercent;


riskSettings.fixedLot =
    body.fixedLot ??
    riskSettings.fixedLot;


riskSettings.maxPositionSize =
    body.maxPositionSize ??
    riskSettings.maxPositionSize;


riskSettings.minimumOrderSize =
    body.minimumOrderSize ??
    riskSettings.minimumOrderSize;


riskSettings.useBalancePercent =
    body.useBalancePercent ??
    riskSettings.useBalancePercent;


riskSettings.maxLossPerTrade =
    body.maxLossPerTrade ??
    riskSettings.maxLossPerTrade;


riskSettings.maxDailyLoss =
    body.maxDailyLoss ??
    riskSettings.maxDailyLoss;


riskSettings.tradeDirection =
    body.tradeDirection ??
    riskSettings.tradeDirection;


    riskSettings.maxPortfolioRisk =
    body.maxPortfolioRisk ??
    riskSettings.maxPortfolioRisk;

riskSettings.riskPerTrade =
    body.riskPerTrade ??
    riskSettings.riskPerTrade;

riskSettings.minBalanceToTrade =
    body.minBalanceToTrade ??
    riskSettings.minBalanceToTrade;


console.log(
    "🔥 POSITION UPDATED:",
    {
        positionMode:
            riskSettings.positionMode,

        fixedLot:
            riskSettings.fixedLot,

        maxPositionSize:
            riskSettings.maxPositionSize
    }
);


console.log(
    "🔥 POSITION POST RECEIVED:",
    JSON.stringify(
        body,
        null,
        2
    )
);

        //riskSettings.stopLoss.enabled = body.stopLossEnabled;
        //riskSettings.stopLoss.mode = body.stopLossMode;
        //riskSettings.stopLoss.value = body.stopLossPercent;
        //riskSettings.stopLoss.price = body.stopLossPrice;
        //riskSettings.stopLoss.atrPeriod = body.atrPeriod;
        //riskSettings.stopLoss.atrMultiplier = body.atrMultiplier;

        if (body.stopLossEnabled !== undefined)
    riskSettings.stopLoss.enabled = body.stopLossEnabled;

if (body.stopLossMode !== undefined)
    riskSettings.stopLoss.mode = body.stopLossMode;

if (body.stopLossPercent !== undefined)
    riskSettings.stopLoss.value = body.stopLossPercent;

if (body.stopLossPrice !== undefined)
    riskSettings.stopLoss.price = body.stopLossPrice;

if (body.atrPeriod !== undefined)
    riskSettings.stopLoss.atrPeriod = body.atrPeriod;

if (body.atrMultiplier !== undefined)
    riskSettings.stopLoss.atrMultiplier = body.atrMultiplier;

        //riskSettings.takeProfit.enabled = body.takeProfitEnabled;
        //riskSettings.takeProfit.mode = body.takeProfitMode;
        //riskSettings.takeProfit.value = body.takeProfitPercent;
        //riskSettings.takeProfit.price = body.takeProfitPrice;
        //riskSettings.takeProfit.rrRatio = body.riskReward;
        //riskSettings.takeProfit.partialClose = body.partialClose;
        //riskSettings.takeProfit.partialClosePercent = body.partialClosePercent;


        if (body.takeProfitEnabled !== undefined)
    riskSettings.takeProfit.enabled = body.takeProfitEnabled;

if (body.takeProfitMode !== undefined)
    riskSettings.takeProfit.mode = body.takeProfitMode;

if (body.takeProfitPercent !== undefined)
    riskSettings.takeProfit.value = body.takeProfitPercent;

if (body.takeProfitPrice !== undefined)
    riskSettings.takeProfit.price = body.takeProfitPrice;

if (body.riskReward !== undefined)
    riskSettings.takeProfit.rrRatio = body.riskReward;

if (body.partialClose !== undefined)
    riskSettings.takeProfit.partialClose = body.partialClose;

if (body.partialClosePercent !== undefined)
    riskSettings.takeProfit.partialClosePercent = body.partialClosePercent;




        // ========================================
// STOP LOSS UPDATE
// ========================================

if (body.stopLoss) {

    riskSettings.stopLoss = {

        ...riskSettings.stopLoss,

        ...body.stopLoss

    };

}


// ========================================
// TAKE PROFIT UPDATE
// ========================================

if (body.takeProfit) {

    riskSettings.takeProfit = {

        ...riskSettings.takeProfit,

        ...body.takeProfit

    };

}

// ========================================
// TRAILING
// ========================================

if (body.trailing) {

    riskSettings.trailing = {

        ...riskSettings.trailing,

        ...body.trailing,

    };

}


// ========================================
// PROTECTION
// ========================================

if (body.protection) {

    riskSettings.protection = {

        ...riskSettings.protection,

        ...body.protection,

    };

}

        if (body.account) {

    riskSettings.account = {
        ...riskSettings.account,
        ...body.account
    };

}


// ========================================
// POSITION SETTINGS
// ========================================

if (
    body.position
) {

    Object.assign(
        riskSettings,
        body.position
    );

}


console.log(
    "🔥 RISK AFTER UPDATE:",
    JSON.stringify(
        riskSettings,
        null,
        2
    )
);


        res.json({
            success: true,
            settings: riskSettings
        });

    }
);



// ========================================
// OPEN ORDERS
// ========================================

app.get(
    "/api/orders/open",
    async (req, res) => {

        try {

            const exchange =
                req.query.exchange ||
                "TOOBIT";


            const orders =
                OrderStore
                    .getAll()
                    .filter(
                        order =>
                            String(order.exchange)
                                .toUpperCase()
                            ===
                            String(exchange)
                                .toUpperCase()
                    );


            return res.json({

                success: true,

                exchange,

                orders

            });

        }
        catch (error) {

            console.error(
                "❌ OPEN ORDERS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);



// ========================================
// CANCEL ORDER
// ========================================

app.post(
    "/api/orders/:orderId/cancel",
    (req, res) => {

        try {

            const {
                orderId
            } = req.params;


            const order =
                OrderStore.getById(
                    orderId
                );


            if (!order) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Order not found"

                    });

            }


            order.status =
                "CANCELED";


            order.canceledAt =
                new Date()
                    .toISOString();


            return res.json({

                success: true,

                orderId

            });

        }
        catch (error) {

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ========================================
// TEST OPEN POSITION
// ========================================

app.post(
    "/api/test/position",
    async (req, res) => {

        try {

            // ========================================
            // MARKET PRICE
            // ========================================

            const symbol =
                req.body?.symbol ??
                riskSettings.account.symbol;

            const exchange =
                req.body?.exchange ??
                riskSettings.account.exchange;

            const marketPrice =
                marketStore
                    ?.prices?.[symbol]
                    ?.price;


            const entryPrice =
                Number(
                    marketPrice ??
                    req.body?.entryPrice ??
                    65000
                );


            // ========================================
            // SIDE
            // ========================================

            const side =
                String(
                    req.body?.side ?? "LONG"
                )
                .trim()
                .toUpperCase();


            // ========================================
            // TIMEFRAME
            // ========================================

            const timeframe =
                req.body?.timeframe ??
                riskSettings.account.timeframe ??
                "1m";


            // ========================================
            // RISK ENGINE
            // ========================================

            const riskPlan =
                RiskManager.process({

                    side,

                    entryPrice,

                    balance:
                        riskSettings.account.balance ||
                        1000,

                    exchange,

                    symbol,

                    timeframe,

                    currentPrice:
                        entryPrice,

                    highestPrice:
                        entryPrice,

                    lowestPrice:
                        entryPrice

                });


            console.dir(
                riskPlan,
                {
                    depth: null
                }
            );


            // ========================================
            // RISK REJECTED
            // ========================================

            if (!riskPlan.allowed) {

                return res.json({

                    success: false,

                    reason:
                        riskPlan.reason

                });

            }


            // ========================================
            // CREATE ORDER
            //
            // IMPORTANT:
            //
            // PositionExecutor مستقیماً صدا زده نمی‌شود.
            //
            // OrderExecutor:
            //
            // PAPER
            //   ↓
            // PaperAccountStore
            //   ↓
            // Reserve Margin
            //   ↓
            // Paper Order FILLED
            //   ↓
            // OrderEventHandler
            //   ↓
            // Position
            //
            // ========================================

            const order = {

                exchange,

                symbol,

                side,

                action:
                    "OPEN",

                type:
                    "MARKET",

                quantity:
                    riskPlan.quantity,

                price:
                    entryPrice,

                leverage:
                    riskPlan.leverage,

                riskAmount:
                    riskPlan.riskAmount,

                stopLoss:
                    riskPlan.stopLoss,

                takeProfit:
                    riskPlan.takeProfit,

                trailing:
                    riskPlan.trailing,

                atr:
                    riskPlan.atr ??
                    null,

                trailingSettings:
                    riskPlan.trailingSettings ??
                    null,

                timeframe,

                confidence:
                    80,

                signalId:
                    req.body?.signalId ??
                    null

            };


            // ========================================
            // EXECUTE ORDER
            // ========================================

            const result =
                await OrderExecutor.execute(
                    order
                );


            // ========================================
            // EXECUTION FAILED
            // ========================================

            if (
                !result ||
                result.success !== true
            ) {

                return res.json({

                    success: false,

                    result

                });

            }


            // ========================================
            // SUCCESS
            // ========================================

            console.log(
                "🟢 TEST PAPER ORDER EXECUTED:",
                result
            );


            return res.json({

                success: true,

                order:
                    result,

                position:
                    result.position ?? null

            });

        }
        catch (error) {

            console.error(
                "❌ TEST POSITION ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);
// ========================================
// DEBUG INDICATORS
// ========================================

app.get(
    "/api/debug/indicators",
    (req, res) => {

        return res.json({

            success: true,

            indicators:
                IndicatorStore.getAll(
                    "TOOBIT",
                    "BTCUSDT",
                    "5m"
                )

        });

    }
);
// ========================================
// DEBUG ALL POSITIONS
// ========================================

app.get(
    "/api/debug/positions/all",
    (req, res) => {

        try {

            return res.json({

                success: true,

                all:
                    PositionStore.getAll()

            });

        }
        catch(error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);
// ========================================
// OPEN POSITIONS
// ========================================
// ویجت OpenPositions از اینجا می‌خواند
// ========================================

app.get(
    "/api/positions/open",
    (req, res) => {

        try {

           // console.log(
//"🟣 SERVER INSTANCE:",
//process.pid
//);


        //    console.log(
 //   "SERVER GET OPEN:",
 //   PositionStore.getAll()
//);

            const positions =
                PositionStore
                    .getAll()
                    .filter(
                        position =>
                            position.status === "OPEN"
                    );


            return res.json({

                success: true,

                count:
                    positions.length,

                positions

            });

        }
        catch (error) {

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ========================================
// CLOSED POSITIONS
// ========================================
// API مخصوص ClosedPositionsWidget
// فرمت خروجی دقیقاً مطابق نیاز فرانت
// ========================================

app.get(
    "/api/positions/closed",
    (req, res) => {

        try {

            const exchange =
                req.query.exchange || "ALL";


            let positions =
                PositionStore
                    .getClosedPositions();


            // ========================================
            // EXCHANGE FILTER
            // ========================================

            if (
                String(exchange).toUpperCase() !== "ALL"
            ) {

                positions =
                    positions.filter(
                        position =>
                            String(
                                position.exchange
                            ).toUpperCase()
                            ===
                            String(
                                exchange
                            ).toUpperCase()
                    );

            }


            // ========================================
            // FORMAT POSITION FOR FRONTEND
            // ========================================

            const formattedPositions =
                positions.map(
                    position => {

                        const entry =
                            Number(
                                position.entryPrice
                            ) || 0;


                        const exit =
                            Number(
                                position.exitPrice
                            ) || 0;


                        const quantity =
                            Number(
                                position.quantity
                            ) || 0;


                        const leverage =
                            Number(
                                position.leverage
                            ) || 1;


                        const pnlValue =
                            Number(
                                position.pnl?.value
                            ) || 0;


                        const pnlPercent =
                            Number(
                                position.pnl?.percent
                            ) || 0;


                        const fees =
                            Number(
                                position.fees
                            ) || 0;


                        // ====================================
                        // HOLDING TIME
                        // ====================================

                        let holding = "N/A";


                        if (
                            position.openedAt &&
                            position.closedAt
                        ) {

                            const openTime =
                                new Date(
                                    position.openedAt
                                ).getTime();


                            const closeTime =
                                new Date(
                                    position.closedAt
                                ).getTime();


                            const difference =
                                Math.max(
                                    0,
                                    closeTime -
                                    openTime
                                );


                            const totalMinutes =
                                Math.floor(
                                    difference /
                                    60000
                                );


                            const days =
                                Math.floor(
                                    totalMinutes /
                                    1440
                                );


                            const hours =
                                Math.floor(
                                    (
                                        totalMinutes %
                                        1440
                                    ) /
                                    60
                                );


                            const minutes =
                                totalMinutes %
                                60;


                            if (days > 0) {

                                holding =
                                    `${days}d ${hours}h`;

                            }
                            else if (hours > 0) {

                                holding =
                                    `${hours}h ${minutes}m`;

                            }
                            else {

                                holding =
                                    `${minutes}m`;

                            }

                        }


                        // ====================================
                        // CLOSE REASON
                        // ====================================

                        let reason =
                            position.reason ||
                            null;


                        if (!reason) {

                            const stopLoss =
                                Number(
                                    position.stopLoss
                                );


                            const takeProfit =
                                Number(
                                    position.takeProfit
                                );


                            if (
                                Number.isFinite(
                                    takeProfit
                                ) &&
                                exit === takeProfit
                            ) {

                                reason =
                                    "Take Profit";

                            }
                            else if (
                                Number.isFinite(
                                    stopLoss
                                ) &&
                                exit === stopLoss
                            ) {

                                reason =
                                    "Stop Loss";

                            }
                            else {

                                reason =
                                    "Manual";

                            }

                        }


                        // ====================================
                        // PERIOD
                        // ====================================

                        let period = "This Month";


                        if (position.closedAt) {

                            const closeDate =
                                new Date(
                                    position.closedAt
                                );


                            const now =
                                new Date();


                            const today =
                                new Date(
                                    now.getFullYear(),
                                    now.getMonth(),
                                    now.getDate()
                                );


                            const closedDay =
                                new Date(
                                    closeDate.getFullYear(),
                                    closeDate.getMonth(),
                                    closeDate.getDate()
                                );


                            const diffDays =
                                Math.floor(
                                    (
                                        today -
                                        closedDay
                                    ) /
                                    86400000
                                );


                            if (diffDays === 0) {

                                period =
                                    "Today";

                            }
                            else if (
                                diffDays === 1
                            ) {

                                period =
                                    "Yesterday";

                            }
                            else if (
                                diffDays >= 0 &&
                                diffDays < 7
                            ) {

                                period =
                                    "This Week";

                            }
                            else {

                                period =
                                    "This Month";

                            }

                        }


                        // ====================================
                        // FINAL FRONTEND OBJECT
                        // ====================================

                        return {

    id:
        position.id,

    positionCode:
        position.positionCode,

    pair:
        position.symbol,

                            exchange:
                                String(
                                    position.exchange || ""
                                ).toUpperCase(),

                            side:
                                position.side ===
                                    "BUY_OPEN"
                                    ? "LONG"
                                    :
                                position.side ===
                                    "SELL_OPEN"
                                    ? "SHORT"
                                    :
                                position.side === "LONG"
                                    ? "LONG"
                                    :
                                position.side === "SHORT"
                                    ? "SHORT"
                                    :
                                    position.side,

                            entry,

                            exit,

                            qty:
                                quantity,

                            leverage,

                            pnl:
                                pnlValue,

                            pnlPercent,

                            fees,

                            holding,

                            reason,

                            period,

                            openTime:
                                position.openedAt,

                            closeTime:
                                position.closedAt,


                            // ====================================
                            // DETAILS
                            // ====================================

                            status:
                                position.status,

                            action:
                                position.action,

                            stopLoss:
                                position.stopLoss,

                            takeProfit:
                                position.takeProfit,

                            trailing:
                                position.trailing,

                            orderType:
                                position.orderType,

                            timeframe:
                                position.timeframe,

                            confidence:
                                position.confidence,

                            signalId:
                                position.signalId,

                            currentPrice:
                                position.currentPrice,

                            highestPrice:
                                position.highestPrice,

                            lowestPrice:
                                position.lowestPrice,

                            exitPrice:
                                position.exitPrice,

                            openedAt:
                                position.openedAt,

                            closedAt:
                                position.closedAt,

                            pnlDetail:
                                position.pnl

                        };

                    }
                );


            // ========================================
            // RESPONSE
            // ========================================

            return res.json({

                success: true,

                exchange,

                count:
                    formattedPositions.length,

                positions:
                    formattedPositions

            });

        }
        catch (error) {

            console.error(
                "❌ CLOSED POSITIONS API ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ========================================
// CLOSE POSITION
// ========================================

app.post(
    "/api/positions/close",
    async (req, res) => {

        try {

            const {
                id,
                exitPrice,
                reason
            } = req.body;


           // console.log(
           //     "🔴 CLOSE REQUEST:",
              //  {
              //      id,
              //      exitPrice,
              //      reason
             //   }
          //  );


            // ========================================
            // FIND POSITION
            // ========================================

            const position =
                PositionStore.getById(
                    id
                );


            if (!position) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Position not found"

                    });

            }


            // ========================================
            // CLOSE THROUGH POSITION CLOSER
            //
            // IMPORTANT:
            //
            // PositionCloser مسئول:
            //
            // PAPER:
            //   PnL
            //   Realized PnL
            //   Balance
            //   Margin Release
            //   Trade Statistics
            //   PositionStore Close
            //
            // LIVE:
            //   Exchange Close Order
            //
            // ========================================

            const result =
                await PositionCloser.close(

                    position,

                    reason ??
                    "MANUAL_CLOSE"

                );


            // ========================================
            // CLOSE FAILED
            // ========================================

            if (
                !result ||
                result.success !== true
            ) {

                console.error(
                    "❌ POSITION CLOSE FAILED:",
                    result
                );


                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            result?.error ||
                            "Position close failed",

                        result

                    });

            }


            // ========================================
            // SUCCESS
            // ========================================

            console.log(
                "🟢 POSITION CLOSED:",
                result
            );


            return res.json({

                success: true,

                position:
                    result.position,

                closePrice:
                    result.closePrice,

                pnl:
                    result.pnl,

                reason:
                    result.reason,

                mode:
                    result.mode

            });

        }
        catch (error) {

            console.error(
                "❌ CLOSE POSITION ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);

// ========================================
// DEBUG INDICATORS
// ========================================

app.get(
    "/api/debug/indicators",
    (req, res) => {

        try {

            const data =
                IndicatorStore.getAll(
                    "TOOBIT",
                    "BTCUSDT",
                    "1m"
                );


            res.json(data);


        } catch(error) {

            res.status(500).json({

                error:
                    error.message

            });

        }

    }
);




// ========================================
// BOT CONTROL API
// ========================================

app.get(
    "/api/bot/status",
    (req, res) => {

        return res.json({

            success: true,

            bot:
                BotController.getStatus(),

            exchanges:
                ExchangeStateManager.getAll()

        });

    }
);


app.post(
    "/api/bot/start",
    (req, res) => {

        const status =
            BotController.start();

        return res.json({

            success: true,

            bot: status

        });

    }
);


app.post(
    "/api/bot/stop",
    (req, res) => {

        const status =
            BotController.stop();

        return res.json({

            success: true,

            bot: status

        });

    }
);


app.post(
    "/api/bot/pause",
    (req, res) => {

        const status =
            BotController.pause();

        return res.json({

            success: true,

            bot: status

        });

    }
);


app.post(
    "/api/bot/freeze",
    (req, res) => {

        const status =
            BotController.freeze();

        return res.json({

            success: true,

            bot: status

        });

    }


    
);

// ==================================================
// EXCHANGE CONTROL API
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/start",
    (req, res) => {

        try {

            const result =
                BotController.startExchange(
                    req.params.exchange
                );

            return res.json({

                success: true,

                result

            });

        }
        catch (error) {

            console.error(
                "❌ EXCHANGE START ERROR:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


app.post(
    "/api/bot/exchange/:exchange/stop",
    (req, res) => {

        const result =
            BotController.stopExchange(
                req.params.exchange
            );

        return res.json({
            success: true,
            result
        });

    }
);


app.post(
    "/api/bot/exchange/:exchange/pause",
    (req, res) => {

        const result =
            BotController.pauseExchange(
                req.params.exchange
            );

        return res.json({
            success: true,
            result
        });

    }
);


app.post(
    "/api/bot/exchange/:exchange/freeze",
    (req, res) => {

        const result =
            BotController.freezeExchange(
                req.params.exchange
            );

        return res.json({
            success: true,
            result
        });

    }
);

// ==================================================
// EXCHANGE ENABLE / DISABLE
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/enable",
    (req, res) => {

        const result =
            BotController.enableExchange(
                req.params.exchange
            );

        return res.json({
            success: true,
            result
        });

    }
);


app.post(
    "/api/bot/exchange/:exchange/disable",
    (req, res) => {

        const result =
            BotController.disableExchange(
                req.params.exchange
            );

        return res.json({
            success: true,
            result
        });

    }
);


// ==================================================
// EXCHANGE AUTO TRADING
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/auto-trading/:value",
    (req, res) => {

        const value =
            req.params.value === "true";

        const result =
            BotController.setExchangeAutoTrading(
                req.params.exchange,
                value
            );

        return res.json({
            success: true,
            result
        });

    }
);



// ==================================================
// EXCHANGE TIMER RESET API
//
// سه Timer کاملاً مستقل:
//
// 1. SESSION TIME
// 2. LAST UPDATE
// 3. LAST CHANGE
//
// Reset در Backend انجام می‌شود.
// ==================================================


// ==================================================
// RESET SESSION TIMER
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/reset/session",
    (req, res) => {

        try {

            const result =
    ExchangeStateManager.resetSessionTime(
        req.params.exchange
    );


            if (!result) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Exchange not found"

                    });

            }


            return res.json({

                success: true,

                timer:
                    "SESSION",

                result

            });

        }
        catch (error) {

            console.error(
                "❌ RESET SESSION TIMER ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ==================================================
// RESET LAST UPDATE TIMER
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/reset/update",
    (req, res) => {

        try {

            const result =
                ExchangeStateManager.resetLastUpdate(
                    req.params.exchange
                );


            if (!result) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Exchange not found"

                    });

            }


            return res.json({

                success: true,

                timer:
                    "LAST_UPDATE",

                result

            });

        }
        catch (error) {

            console.error(
                "❌ RESET LAST UPDATE TIMER ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ==================================================
// RESET LAST CHANGE TIMER
// ==================================================

app.post(
    "/api/bot/exchange/:exchange/reset/change",
    (req, res) => {

        try {

            const result =
                ExchangeStateManager.resetLastChange(
                    req.params.exchange
                );


            if (!result) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "Exchange not found"

                    });

            }


            return res.json({

                success: true,

                timer:
                    "LAST_CHANGE",

                result

            });

        }
        catch (error) {

            console.error(
                "❌ RESET LAST CHANGE TIMER ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);



// ========================================
// START SYSTEM
// ========================================

async function start() {

    console.log(
        "🚀 BOOTING SYSTEM..."
    );


// ========================================
// RESTORE STRATEGY SETTINGS
// ========================================

await StrategySettingsStore.ready;


const savedStrategySettings =
    StrategySettingsStore.get(
        strategySettings.exchange,
        strategySettings.symbol,
        strategySettings.timeframe
    );


if (savedStrategySettings) {

    Object.assign(
        strategySettings,
        savedStrategySettings
    );


    console.log(
        "🟢 STRATEGY SETTINGS RESTORED"
    );


   // console.log(
   // "🔥 RESTORED STRATEGY SETTINGS:",
   // JSON.stringify(strategySettings, null, 2)
//);

}




    exchangeManager =
        new ExchangeManager();


    await exchangeManager.init();


    PositionStore.setCandleStore(exchangeManager.candleStore);



    // ========================================
    // CONNECT EXECUTION ENGINE
    // ========================================

    OrderExecutor.setExchangeManager(
        exchangeManager
    );


    ExecutionEngine.setOrderExecutor(
        OrderExecutor
    );



    // ========================================
    // START WEBSOCKET
    // ========================================

    createWSServer(

        marketStore,

        exchangeManager.candleStore,

        exchangeManager.volumeTracker

    );
///////////////////////////////////////////////

// ========================================
// DEBUG ATR
// ========================================


app.get("/api/debug/atr", (req, res) => {

    return res.json({

        atr: IndicatorStore.get(
            "TOOBIT",
            "BTCUSDT",
            "1m",
            "ATR"
        )

    });

});


    // ========================================
    // START HTTP
    // ========================================

    //server.listen(
       // 3000,
       // () => {

         //   console.log(
          //      "🚀 HTTP running http://localhost:3000"
          //  );

        //}
    //);


    //console.log(
    //    "🟢 SYSTEM READY"
    //);




    // ========================================
// START HTTP AFTER POSITION RESTORE
// ========================================

await Promise.all([
    PositionStore.ready,
    RiskStore.ready
]);

server.listen(
    3000, 




    () => {

        console.log(
            "🚀 HTTP running http://localhost:3000"
        );

        console.log(
            "🟢 SYSTEM READY"
        );

    }
);


    // ========================================
// POSITION MONITOR
// ========================================

setInterval(async () => {

    await PositionMonitor.update();

},1000);

//console.log("🟢 POSITION MONITOR STARTED");

}



start();