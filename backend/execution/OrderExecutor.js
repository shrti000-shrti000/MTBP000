
//



// ======================================================
// MTBP
// OrderExecutor
// ======================================================

import OrderStatus from "../storage/OrderStatus.js";
import OrderStore from "../storage/OrderStore.js";
import OrderResponseMapper from "./OrderResponseMapper.js";
import LiveTradingManager from "../config/LiveTradingManager.js";
import OrderEventHandler from "./OrderEventHandler.js";
import PaperAccountStore from "../storage/PaperAccountStore.js";
import PositionStore from "../risk/PositionStore.js";
import riskSettings from "../config/riskSettings.js";


class OrderExecutor {

    constructor({
        exchangeManager = null
    } = {}) {

        this.exchangeManager =
            exchangeManager;

        // ==================================================
        // OPEN ORDER LOCKS
        //
        // یک OPEN همزمان برای هر Symbol
        // از رزرو Margin یا ارسال سفارش تکراری جلوگیری می‌کند.
        // ==================================================

        this.openOrderLocks =
            new Map();

    }


    // ==================================================
    // SET EXCHANGE MANAGER
    // ==================================================

    setExchangeManager(exchangeManager) {

        this.exchangeManager =
            exchangeManager;

    }


    // ==================================================
    // OPEN ORDER LOCK
    // ==================================================

    async acquireOpenOrderLock(symbol) {

        const normalizedSymbol =
            String(
                symbol ?? ""
            )
            .trim()
            .toUpperCase();


        if (!normalizedSymbol) {

            return () => {};

        }


        const previous =
            this.openOrderLocks.get(
                normalizedSymbol
            ) ||
            Promise.resolve();


        let releaseCurrent;


        const current =
            new Promise(resolve => {

                releaseCurrent =
                    resolve;

            });


        const chain =
            previous.then(
                () => current
            );


        this.openOrderLocks.set(
            normalizedSymbol,
            chain
        );


        await previous;


        return () => {

            releaseCurrent();


            if (
                this.openOrderLocks.get(
                    normalizedSymbol
                ) === chain
            ) {

                this.openOrderLocks.delete(
                    normalizedSymbol
                );

            }

        };

    }


    // ==================================================
    // MAX OPEN POSITIONS
    //
    // فقط OPEN سفارش‌ها را محدود می‌کند.
    //
    // CLOSE همیشه مجاز است.
    // ==================================================

    getMaxOpenPositions() {

        const value =
            Number(
                riskSettings
                    ?.protection
                    ?.maxOpenPositions
            );


        if (
            !Number.isFinite(value) ||
            value < 1
        ) {

            return Infinity;

        }


        return Math.floor(value);

    }


    getOpenPositionCount() {

        try {

            const positions =
                PositionStore.getOpenPositions?.();


            if (
                Array.isArray(positions)
            ) {

                return positions.length;

            }


            // اگر getOpenPositions وجود نداشت،
            // از getAll در صورت موجود بودن استفاده می‌کنیم.

            const allPositions =
                PositionStore.getAll?.();


            if (
                Array.isArray(allPositions)
            ) {

                return allPositions.filter(
                    position =>
                        String(
                            position?.status ?? ""
                        )
                        .trim()
                        .toUpperCase() ===
                        "OPEN"
                ).length;

            }


            return 0;

        }
        catch (error) {

            console.error(
                "❌ OPEN POSITION COUNT ERROR:",
                error
            );

            return 0;

        }

    }


    // ==================================================
    // CHECK MAX OPEN POSITIONS
    //
    // این Check فقط برای OPEN استفاده می‌شود.
    // ==================================================

    checkMaxOpenPositions() {

        const maxOpenPositions =
            this.getMaxOpenPositions();


        const openPositionCount =
            this.getOpenPositionCount();


        if (
            openPositionCount >=
            maxOpenPositions
        ) {

            return {

                allowed: false,

                openPositionCount,

                maxOpenPositions,

                reason:
                    "MAX_OPEN_POSITIONS_REACHED"

            };

        }


        return {

            allowed: true,

            openPositionCount,

            maxOpenPositions,

            reason: null

        };

    }


    // ==================================================
    // EXECUTE ORDER
    // ==================================================

    async execute(order) {

        if (!order) {

            return {
                success: false,
                error: "Order is required"
            };

        }


        // ==================================================
        // PAPER MODE
        // ==================================================

        if (
            LiveTradingManager.isPaperMode()
        ) {

            return await this.executePaperOrder(
                order
            );

        }


        // ==================================================
        // LIVE MODE
        // ==================================================

        if (!this.exchangeManager) {

            return {

                success: false,
                blocked: true,

                error:
                    "ExchangeManager is not configured"

            };

        }


        const adapter =
            this.exchangeManager.getAdapter(
                order.exchange
            );


        if (!adapter) {

            return {

                success: false,
                blocked: true,

                error:
                    `Exchange adapter not found: ${order.exchange}`

            };

        }


        const action =
            String(
                order.action ?? ""
            )
            .trim()
            .toUpperCase();


        const side =
            String(
                order.side ?? ""
            )
            .trim()
            .toUpperCase();


        const isOpenOrder =
            action === "OPEN" ||
            side === "BUY_OPEN" ||
            side === "SELL_OPEN";


        const isCloseOrder =
            action === "CLOSE" ||
            side === "BUY_CLOSE" ||
            side === "SELL_CLOSE";


        // ==================================================
        // LIVE OPEN LOCK
        // ==================================================

        let releaseOpenLock = null;


        if (
            isOpenOrder
        ) {

            releaseOpenLock =
                await this.acquireOpenOrderLock(
                    order.symbol
                );


            // ==================================================
            // CHECK MAX OPEN POSITIONS
            //
            // بعد از گرفتن Symbol Lock انجام می‌شود
            // تا چند درخواست همزمان از سقف عبور نکنند.
            // ==================================================

            const positionLimit =
                this.checkMaxOpenPositions();


            if (
                !positionLimit.allowed
            ) {

                console.warn(
                    "⛔ MAX OPEN POSITIONS REACHED:",
                    {
                        exchange:
                            order.exchange,

                        symbol:
                            order.symbol,

                        openPositionCount:
                            positionLimit.openPositionCount,

                        maxOpenPositions:
                            positionLimit.maxOpenPositions
                    }
                );


                if (
                    releaseOpenLock
                ) {

                    releaseOpenLock();

                    releaseOpenLock = null;

                }


                return {

                    success: false,

                    blocked: true,

                    reason:
                        positionLimit.reason,

                    openPositionCount:
                        positionLimit.openPositionCount,

                    maxOpenPositions:
                        positionLimit.maxOpenPositions,

                    exchange:
                        order.exchange,

                    symbol:
                        order.symbol,

                    side:
                        order.side ?? null,

                    error:
                        "MAX_OPEN_POSITIONS_REACHED"

                };

            }


            // ==================================================
            // CHECK EXISTING OPEN POSITION
            // ==================================================

            try {

                const existingPosition =
                    PositionStore.getOpenBySymbol(
                        order.symbol
                    );


                if (
                    existingPosition
                ) {

                    console.warn(
                        "⚠️ POSITION ALREADY OPEN:",
                        {
                            symbol:
                                order.symbol,

                            exchange:
                                order.exchange
                        }
                    );


                    return {

                        success: false,

                        blocked: true,

                        duplicate: true,

                        exchange:
                            order.exchange,

                        symbol:
                            order.symbol,

                        side:
                            order.side ?? null,

                        error:
                            "POSITION_ALREADY_OPEN"

                    };

                }

            }
            finally {

                // Lock تا پایان placeOrder حفظ می‌شود.

            }

        }


        let response;


        try {

            response =
                await adapter.placeOrder(
                    order
                );

        }
        catch (error) {

            const rejectedOrder = {

                success: false,

                exchange:
                    order.exchange,

                orderId:
                    null,

                symbol:
                    order.symbol ?? null,

                side:
                    order.side ?? null,

                type:
                    order.type ?? null,

                quantity:
                    order.quantity ?? null,

                status:
                    "REJECTED",

                error:
                    error?.message ||
                    "Order execution failed",

                createdAt:
                    Date.now()

            };


            OrderStore.add(
                rejectedOrder
            );


            return rejectedOrder;

        }
        finally {

            if (
                releaseOpenLock
            ) {

                releaseOpenLock();

            }

        }


        const result =
            OrderResponseMapper.map({

                exchange:
                    order.exchange,

                order,

                response

            });


        OrderStore.add(
            result
        );


        if (result.orderId) {

            OrderStatus.set(

                result.orderId,

                result.status

            );

        }


        return result;

    }


    // ==================================================
    // PAPER ORDER
    //
    // OPEN:
    //   Check balance
    //   Check max open positions
    //   Check duplicate position
    //   Reserve margin
    //   Create FILLED order
    //   Create Position
    //
    // CLOSE:
    //   No new margin reservation
    //   Execute simulated close
    // ==================================================

    async executePaperOrder(order) {

        // ==================================================
        // WAIT FOR ACCOUNT RESTORE
        // ==================================================

        if (
            PaperAccountStore.ready
        ) {

            await PaperAccountStore.ready;

        }


        // ==================================================
        // NORMALIZE EXCHANGE
        // ==================================================

        const exchange =
            String(
                order.exchange ?? ""
            )
            .trim()
            .toUpperCase();


        if (!exchange) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                error:
                    "EXCHANGE_REQUIRED"

            };

        }


        // ==================================================
        // NORMALIZE QUANTITY
        // ==================================================

        const quantity =
            Number(
                order.quantity
            );


        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                error:
                    "INVALID_QUANTITY"

            };

        }


        // ==================================================
        // NORMALIZE PRICE
        // ==================================================

        const fillPrice =
            Number(
                order.price
            );


        if (
            !Number.isFinite(fillPrice) ||
            fillPrice <= 0
        ) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                symbol:
                    order.symbol ?? null,

                error:
                    "INVALID_PRICE"

            };

        }


        // ==================================================
        // NORMALIZE LEVERAGE
        // ==================================================

        const leverage =
            Number(
                order.leverage ?? 1
            );


        if (
            !Number.isFinite(leverage) ||
            leverage <= 0
        ) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                symbol:
                    order.symbol ?? null,

                error:
                    "INVALID_LEVERAGE"

            };

        }


        // ==================================================
        // GET PAPER ACCOUNT
        // ==================================================

        const paperAccount =
            PaperAccountStore.getByExchange(
                exchange
            );


        if (!paperAccount) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                symbol:
                    order.symbol ?? null,

                error:
                    "PAPER_ACCOUNT_NOT_FOUND"

            };

        }


        // ==================================================
        // DETERMINE OPEN / CLOSE
        // ==================================================

        const side =
            String(
                order.side ?? ""
            )
            .trim()
            .toUpperCase();


        const action =
            String(
                order.action ?? ""
            )
            .trim()
            .toUpperCase();


        const isOpenOrder =
            action === "OPEN" ||
            side === "BUY_OPEN" ||
            side === "SELL_OPEN";


        const isCloseOrder =
            action === "CLOSE" ||
            side === "BUY_CLOSE" ||
            side === "SELL_CLOSE";


        // ==================================================
        // VALIDATE ACTION
        // ==================================================

        if (
            !isOpenOrder &&
            !isCloseOrder
        ) {

            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                symbol:
                    order.symbol ?? null,

                side,

                action,

                error:
                    "INVALID_ORDER_ACTION"

            };

        }


        // ==================================================
        // PAPER OPEN LOCK
        // ==================================================

        let releaseOpenLock = null;


        if (
            isOpenOrder
        ) {

            releaseOpenLock =
                await this.acquireOpenOrderLock(
                    order.symbol
                );


            // ==================================================
            // CHECK MAX OPEN POSITIONS
            //
            // باید بعد از گرفتن Lock باشد تا
            // درخواست‌های همزمان از سقف عبور نکنند.
            // ==================================================

            const positionLimit =
                this.checkMaxOpenPositions();


            if (
                !positionLimit.allowed
            ) {

                console.warn(
                    "⛔ MAX OPEN POSITIONS REACHED:",
                    {
                        exchange,

                        symbol:
                            order.symbol,

                        openPositionCount:
                            positionLimit.openPositionCount,

                        maxOpenPositions:
                            positionLimit.maxOpenPositions
                    }
                );


                if (
                    releaseOpenLock
                ) {

                    releaseOpenLock();

                    releaseOpenLock = null;

                }


                return {

                    success: false,

                    paper: true,

                    mode:
                        "PAPER",

                    status:
                        "REJECTED",

                    blocked:
                        true,

                    reason:
                        positionLimit.reason,

                    openPositionCount:
                        positionLimit.openPositionCount,

                    maxOpenPositions:
                        positionLimit.maxOpenPositions,

                    exchange,

                    symbol:
                        order.symbol ?? null,

                    side:
                        order.side ?? null,

                    error:
                        "MAX_OPEN_POSITIONS_REACHED"

                };

            }


            // ==================================================
            // CHECK EXISTING OPEN POSITION
            //
            // این بررسی قبل از reserveMargin انجام می‌شود.
            // ==================================================

            const existingPosition =
                PositionStore.getOpenBySymbol(
                    order.symbol
                );


            if (
                existingPosition
            ) {

                console.warn(
                    "⚠️ POSITION ALREADY OPEN:",
                    {
                        symbol:
                            order.symbol,

                        exchange
                    }
                );


                if (
                    releaseOpenLock
                ) {

                    releaseOpenLock();

                    releaseOpenLock = null;

                }


                return {

                    success: false,

                    paper: true,

                    mode:
                        "PAPER",

                    status:
                        "REJECTED",

                    blocked:
                        true,

                    duplicate:
                        true,

                    exchange,

                    symbol:
                        order.symbol ?? null,

                    side:
                        order.side ?? null,

                    error:
                        "POSITION_ALREADY_OPEN"

                };

            }

        }


        // ==================================================
        // NOTIONAL
        // ==================================================

        const notional =
            fillPrice *
            quantity;


        // ==================================================
        // REQUIRED MARGIN
        // ==================================================

        const requiredMargin =
            isOpenOrder
                ? notional / leverage
                : 0;


        // ==================================================
        // AVAILABLE BALANCE
        // ==================================================

        const availableBalance =
            Number(
                paperAccount.availableBalance ?? 0
            );


        // ==================================================
        // CHECK BALANCE
        // ==================================================

        if (
            isOpenOrder &&
            requiredMargin >
            availableBalance
        ) {

            if (
                releaseOpenLock
            ) {

                releaseOpenLock();

                releaseOpenLock = null;

            }


            return {

                success: false,
                paper: true,
                mode: "PAPER",
                status: "REJECTED",

                exchange,

                symbol:
                    order.symbol ?? null,

                side:
                    order.side ?? null,

                quantity,

                price:
                    fillPrice,

                leverage,

                notional,

                requiredMargin,

                availableBalance,

                error:
                    "INSUFFICIENT_PAPER_BALANCE"

            };

        }


        // ==================================================
        // RESERVE PAPER MARGIN
        // ==================================================

        let reservedMargin = 0;


        if (
            isOpenOrder &&
            requiredMargin > 0
        ) {

            const reserveResult =
                await PaperAccountStore.reserveMargin(
                    exchange,
                    requiredMargin
                );


            if (
                !reserveResult
            ) {

                if (
                    releaseOpenLock
                ) {

                    releaseOpenLock();

                    releaseOpenLock = null;

                }


                return {

                    success: false,

                    paper: true,

                    mode:
                        "PAPER",

                    status:
                        "REJECTED",

                    exchange,

                    symbol:
                        order.symbol ?? null,

                    quantity,

                    price:
                        fillPrice,

                    leverage,

                    notional,

                    requiredMargin,

                    availableBalance:
                        Number(
                            PaperAccountStore
                                .getByExchange(exchange)
                                ?.availableBalance ?? 0
                        ),

                    error:
                        "PAPER_MARGIN_RESERVATION_FAILED"

                };

            }


            reservedMargin =
                requiredMargin;

        }


        // ==================================================
        // CREATE PAPER ORDER ID
        // ==================================================

        const orderId =
            `PAPER-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase()}`;


        // ==================================================
        // PAPER ORDER RESULT
        // ==================================================

        const paperOrder = {

            success: true,

            paper: true,

            mode:
                "PAPER",

            exchange,

            orderId,

            symbol:
                order.symbol ?? null,

            side:
                order.side ?? null,

            action:
                order.action ?? "OPEN",

            type:
                order.type ?? "MARKET",

            quantity,

            price:
                fillPrice,

            leverage,

            // ==================================================
            // RISK AMOUNT
            // از ExecutionEngine دریافت می‌شود و باید
            // تا PositionStore حفظ شود.
            // ==================================================

            riskAmount:
                Number(
                    order.riskAmount ?? 0
                ),

            notional,

            requiredMargin,

            reservedMargin,

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

            signalId:
                order.signalId ?? null,

            confidence:
                order.confidence ?? null,

            timeframe:
                order.timeframe ?? null,

            status:
                "FILLED",

            filledPrice:
                fillPrice,

            filledQuantity:
                quantity,

            createdAt:
                new Date().toISOString(),

            filledAt:
                new Date().toISOString()

        };


        // ==================================================
        // SAVE PAPER ORDER
        // ==================================================

        try {

            OrderStore.add(
                paperOrder
            );

        }
        catch (error) {

            // اگر ذخیره Order شکست خورد،
            // Margin رزرو شده باید برگردد.

            if (
                isOpenOrder &&
                reservedMargin > 0
            ) {

                try {

                    await PaperAccountStore
                        .releaseMargin(
                            exchange,
                            reservedMargin
                        );

                }
                catch (releaseError) {

                    console.error(
                        "❌ PAPER MARGIN ROLLBACK FAILED:",
                        releaseError
                    );

                }

            }


            if (
                releaseOpenLock
            ) {

                releaseOpenLock();

                releaseOpenLock = null;

            }


            return {

                success: false,

                paper: true,

                mode:
                    "PAPER",

                status:
                    "REJECTED",

                exchange,

                error:
                    error?.message ||
                    "PAPER_ORDER_SAVE_FAILED"

            };

        }


        // ==================================================
        // SAVE ORDER STATUS
        // ==================================================

        OrderStatus.set(

            orderId,

            "FILLED"

        );


        // ==================================================
        // CLOSE ORDER
        // ==================================================

        if (isCloseOrder) {

            return {

                ...paperOrder,

                position:
                    null

            };

        }


        // ==================================================
        // INTERNAL FILLED EVENT
        // ==================================================

        const filledEvent = {

            orderId,

            status:
                "FILLED"

        };


        // ==================================================
        // CREATE POSITION
        // ==================================================

        let positionResult;


        try {

            positionResult =
                await OrderEventHandler.handle(
                    filledEvent
                );

        }
        catch (error) {

            // اگر Position ساخته نشد،،
            // Margin رزرو شده را آزاد می‌کنیم.

            if (
                reservedMargin > 0
            ) {

                try {

                    await PaperAccountStore
                        .releaseMargin(
                            exchange,
                            reservedMargin
                        );

                }
                catch (releaseError) {

                    console.error(
                        "❌ PAPER MARGIN ROLLBACK FAILED:",
                        releaseError
                    );

                }

            }


            if (
                releaseOpenLock
            ) {

                releaseOpenLock();

                releaseOpenLock = null;

            }


            return {

                success: false,

                paper: true,

                mode:
                    "PAPER",

                status:
                    "REJECTED",

                exchange,

                orderId,

                error:
                    error?.message ||
                    "POSITION_CREATION_FAILED"

            };

        }


        // ==================================================
        // RELEASE OPEN LOCK
        // ==================================================

        if (
            releaseOpenLock
        ) {

            releaseOpenLock();

            releaseOpenLock = null;

        }


        // ==================================================
        // RETURN RESULT
        // ==================================================

        return {

            ...paperOrder,

            position:
                positionResult?.position ?? null

        };

    }

}


// ======================================================
// SINGLETON
// ======================================================

export default new OrderExecutor();