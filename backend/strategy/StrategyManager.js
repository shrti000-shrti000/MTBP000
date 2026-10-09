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
    async process(exchange, symbol, timeframe, indicators, marketData) {
        const ACTIVE_TRADING_TIMEFRAME = "15m";

        if (timeframe !== ACTIVE_TRADING_TIMEFRAME) {
            return {
                signal: "WAIT",
                side: null,
                tradePlan: null,
                execution: null,
                blocked: true,
                reason: `TIMEFRAME_DISABLED_${timeframe}`
            };
        }

        const signal = SignalEngine.calculate(indicators);
        const botRunning = BotController.isRunning();
        const exchangePermission = ExchangeStateManager.canTrade(exchange);

        if (!botRunning) {
            return {
                ...signal,
                side: null,
                tradePlan: null,
                execution: null,
                blocked: true,
                reason: `BOT_${BotController.getStatus().status}`
            };
        }

        if (!exchangePermission.allowed) {
            return {
                ...signal,
                side: null,
                tradePlan: null,
                execution: null,
                blocked: true,
                reason: exchangePermission.reason
            };
        }

        await StrategyStateStore.set(exchange, symbol, timeframe, {
            lastSignal: signal.signal,
            confidence: signal.confidence,
            buyScore: signal.buyScore,
            sellScore: signal.sellScore,
            buyVotes: signal.buyVotes,
            sellVotes: signal.sellVotes,
            updatedAt: new Date().toISOString()
        });

        signal.exchange = exchange;
        signal.symbol = symbol;
        signal.timeframe = timeframe;

        // Read the previous signal BEFORE saving the current signal.
        const lastSignal = await SignalMemory.get(
            exchange,
            symbol,
            timeframe
        );

        signal.isDuplicate = lastSignal === signal.signal;

        // Persist a normalized signal string after the comparison.
        await SignalMemory.set(
            exchange,
            symbol,
            timeframe,
            { signal: signal.signal }
        );

        let side = null;

        if (signal.signal === "LONG") {
            side = "LONG";
        } else if (signal.signal === "SHORT") {
            side = "SHORT";
        }

        let tradePlan = null;
        let execution = null;

        if (side && marketData) {
            const balance = LiveTradingManager.isPaperMode()
                ? PaperAccountStore.getBalance()
                : Number(marketData.balance ?? 0);

            console.log("💰 ACCOUNT BALANCE:", {
                mode: LiveTradingManager.isPaperMode() ? "PAPER" : "LIVE",
                balance
            });

            tradePlan = RiskManager.process({
                side,
                entryPrice: marketData.price,
                balance,
                currentPrice: marketData.price,
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

            console.log("🔍 BEFORE EXECUTION CHECK:", {
                signal: signal.signal,
                side,
                marketData,
                tradePlan
            });

            if (tradePlan?.allowed) {
                console.log("🚨 REACHED EXECUTION:", {
                    exchange,
                    symbol,
                    timeframe,
                    signal: signal.signal,
                    side,
                    tradePlan
                });

                execution = await ExecutionEngine.execute(
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
                        confidence: signal.confidence ?? null,
                        signalId: signal.id ?? null
                    }
                );

                console.log("🚀 EXECUTION RESULT:", {
                    exchange,
                    symbol,
                    side,
                    execution
                });
            }
        } else {
            console.log("⛔ TRADE BLOCKED BY RISK:", {
                signal: signal.signal,
                side,
                tradePlan
            });
        }

        return {
            ...signal,
            side,
            tradePlan,
            execution
        };
    }
}

export default new StrategyManager();
