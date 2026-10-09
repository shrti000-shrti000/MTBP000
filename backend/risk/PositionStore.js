// ======================================================
// MTBP
// PositionStore
// ======================================================

import crypto from "crypto";

import TrailingStopEngine
    from "./TrailingStopEngine.js";

import PositionRepository
    from "../storage/repositories/PositionRepository.js";

import PaperAccountStore
    from "../storage/PaperAccountStore.js";

import IndicatorStore
    from "../indicators/core/IndicatorStore.js";

import riskSettings
    from "../config/riskSettings.js";


// ======================================================
// POSITION STORE
// ======================================================

class PositionStore {

    constructor() {

        this.positions = [];

        this.repository =
            PositionRepository;


        // ==================================================
        // REAL CANDLE STORE
        // ==================================================

        this.candleStore = null;


        // ==================================================
        // OPEN POSITION LOCK
        // ==================================================

        this.openPositionLock =
            Promise.resolve();

        this.ready =
            this.loadFromDatabase();

    }


    // ==================================================
    // SET CANDLE STORE
    // ==================================================

    setCandleStore(candleStore) {

        if (
            !candleStore ||
            typeof candleStore.get !== "function"
        ) {

            console.error(
                "❌ INVALID CANDLE STORE PROVIDED TO POSITION STORE"
            );

            return false;

        }


        this.candleStore =
            candleStore;


        console.log(
            "🟢 POSITION STORE CONNECTED TO EXCHANGE CANDLE STORE"
        );


        return true;

    }


    // ==================================================
    // LOAD POSITIONS FROM DATABASE
    // ==================================================

    async loadFromDatabase() {

        try {

            const rows =
                await this.repository.findAll();


            if (!Array.isArray(rows)) {

                this.positions = [];

                return;

            }


            this.positions =
                rows.map(row => {

                    const exchange =
                        row.exchange ?? null;

                    const symbol =
                        String(
                            row.symbol ?? ""
                        )
                        .trim()
                        .toUpperCase();

                    const timeframe =
                        row.timeframe ?? null;


                    const restoredTrailingSettings =
                        row.trailing_settings ??
                        riskSettings.trailing ??
                        null;


                    let restoredAtr = null;


                    if (
                        row.atr !== null &&
                        row.atr !== undefined &&
                        Number.isFinite(
                            Number(row.atr)
                        )
                    ) {

                        restoredAtr =
                            Number(row.atr);

                    }
                    else if (
                        exchange &&
                        symbol &&
                        timeframe
                    ) {

                        const atrData =
                            IndicatorStore.get(
                                exchange,
                                symbol,
                                timeframe,
                                "ATR"
                            );


                        if (
                            atrData !== null &&
                            atrData !== undefined
                        ) {

                            const atrValue =
                                typeof atrData === "object"
                                    ? atrData?.value
                                    : atrData;


                            if (
                                Number.isFinite(
                                    Number(atrValue)
                                )
                            ) {

                                restoredAtr =
                                    Number(atrValue);

                            }

                        }

                    }


                    return {

                        id:
                            row.id,

                        positionCode:
                            row.position_code,

                        exchange,

                        symbol,

                        side:
                            String(
                                row.side ?? ""
                            )
                            .trim()
                            .toUpperCase(),

                        action:
                            row.action ?? "OPEN",

                        mode:
                            String(
                                row.mode ?? "PAPER"
                            )
                            .trim()
                            .toUpperCase() === "LIVE"
                                ? "LIVE"
                                : "PAPER",

                        status:
                            String(
                                row.status ?? "OPEN"
                            )
                            .trim()
                            .toUpperCase() === "CLOSED"
                                ? "CLOSED"
                                : "OPEN",

                        entryPrice:
                            Number(
                                row.entry_price ?? 0
                            ),

                        quantity:
                            Number(
                                row.quantity ?? 0
                            ),

                        leverage:
                            Number(
                                row.leverage ?? 1
                            ),

                        stopLoss:
                            row.stop_loss !== null &&
                            row.stop_loss !== undefined
                                ? Number(row.stop_loss)
                                : null,

                        takeProfit:
                            row.take_profit !== null &&
                            row.take_profit !== undefined
                                ? Number(row.take_profit)
                                : null,

                        riskAmount:
                            Number(
                                row.risk_amount ?? 0
                            ),

                        trailing:
                            row.trailing ?? null,

                        atr:
                            restoredAtr,

                        trailingSettings:
                            restoredTrailingSettings,

                        orderType:
                            row.order_type ?? "MARKET",

                        timeframe,

                        confidence:
                            row.confidence !== null &&
                            row.confidence !== undefined
                                ? Number(row.confidence)
                                : null,

                        signalId:
                            row.signal_id ?? null,

                        openedAt:
                            row.opened_at ?? null,

                        closedAt:
                            row.closed_at ?? null,

                        exitPrice:
                            row.exit_price !== null &&
                            row.exit_price !== undefined
                                ? Number(row.exit_price)
                                : null,

                        reason:
                            row.reason ?? null,

                        currentPrice:
                            row.current_price !== null &&
                            row.current_price !== undefined
                                ? Number(row.current_price)
                                : Number(
                                    row.entry_price ?? 0
                                ),

                        highestPrice:
                            row.highest_price !== null &&
                            row.highest_price !== undefined
                                ? Number(row.highest_price)
                                : Number(
                                    row.entry_price ?? 0
                                ),

                        lowestPrice:
                            row.lowest_price !== null &&
                            row.lowest_price !== undefined
                                ? Number(row.lowest_price)
                                : Number(
                                    row.entry_price ?? 0
                                ),

                        fees:
                            Number(
                                row.fees ?? 0
                            ),

                        pnl: {

                            value:
                                Number(
                                    row.pnl_value ?? 0
                                ),

                            percent:
                                Number(
                                    row.pnl_percent ?? 0
                                )

                        },

                        marginReserved:
                            String(
                                row.status ?? "OPEN"
                            )
                            .trim()
                            .toUpperCase() !== "CLOSED" &&
                            String(
                                row.mode ?? "PAPER"
                            )
                            .trim()
                            .toUpperCase() !== "LIVE"

                    };

                });


            console.log(
                `🟢 POSITIONS RESTORED: ${this.positions.length}`
            );


            await this.rebuildPaperAccounts();

        }
        catch (error) {

            console.error(
                "❌ POSITION DATABASE LOAD ERROR:",
                error?.message || error
            );

            this.positions = [];

        }

    }


    // ==================================================
    // WAIT UNTIL READY
    // ==================================================

    async waitUntilReady() {

        await this.ready;

        return this.getAll();

    }


    // ==================================================
    // RUN OPEN POSITION LOCK
    // ==================================================

    async runOpenPositionLock(callback) {

        const previousLock =
            this.openPositionLock;


        let releaseLock;


        this.openPositionLock =
            new Promise(resolve => {

                releaseLock =
                    resolve;

            });


        await previousLock;


        try {

            return await callback();

        }
        finally {

            releaseLock();

        }

    }


    // ==================================================
    // GENERATE POSITION CODE
    // ==================================================

    generatePositionCode() {

        const now =
            new Date();

        const date =
            now.toISOString()
                .slice(0, 10)
                .replace(/-/g, "");

        const prefix =
            `POS-${date}-`;


        const numbers =
            this.positions
                .map(position =>
                    String(
                        position.positionCode || ""
                    )
                )
                .filter(code =>
                    code.startsWith(prefix)
                )
                .map(code => {

                    const number =
                        Number(
                            code.replace(
                                prefix,
                                ""
                            )
                        );

                    return Number.isFinite(number)
                        ? number
                        : 0;

                });


        const nextNumber =
            numbers.length > 0
                ? Math.max(...numbers) + 1
                : 1;


        return (
            prefix +
            String(nextNumber)
                .padStart(6, "0")
        );

    }


    // ==================================================
    // CHECK OPEN POSITION
    // ==================================================

    hasOpenPosition(symbol) {

        const normalizedSymbol =
            String(
                symbol ?? ""
            )
            .trim()
            .toUpperCase();


        if (!normalizedSymbol) {

            return false;

        }


        return this.positions.some(

            position =>

                String(
                    position.symbol ?? ""
                )
                .trim()
                .toUpperCase() ===
                normalizedSymbol &&

                position.status === "OPEN"

        );

    }


    // ==================================================
    // CHECK POSITION CODE
    // ==================================================

    hasPositionCode(positionCode) {

        const normalizedCode =
            String(
                positionCode ?? ""
            )
            .trim();


        if (!normalizedCode) {

            return false;

        }


        return this.positions.some(

            position =>

                String(
                    position.positionCode ?? ""
                )
                .trim() ===
                normalizedCode

        );

    }


    // ==================================================
    // CALCULATE REQUIRED MARGIN
    // ==================================================

    calculateMargin(position) {

        const entryPrice =
            Number(
                position?.entryPrice
            );

        const quantity =
            Number(
                position?.quantity
            );

        const leverage =
            Number(
                position?.leverage ?? 1
            );


        if (
            !Number.isFinite(entryPrice) ||
            entryPrice <= 0 ||
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(leverage) ||
            leverage <= 0
        ) {

            return 0;

        }


        const notional =
            entryPrice *
            quantity;


        const margin =
            notional /
            leverage;


        if (
            !Number.isFinite(margin) ||
            margin <= 0
        ) {

            return 0;

        }


        return Number(
            margin.toFixed(2)
        );

    }


    // ==================================================
    // CALCULATE POSITION EXPOSURE
    // ==================================================

    calculatePositionExposure(position) {

        const entryPrice =
            Number(
                position?.entryPrice
            );

        const quantity =
            Number(
                position?.quantity
            );


        if (
            !Number.isFinite(entryPrice) ||
            entryPrice <= 0 ||
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            return 0;

        }


        const exposure =
            entryPrice *
            quantity;


        if (
            !Number.isFinite(exposure) ||
            exposure <= 0
        ) {

            return 0;

        }


        return Number(
            exposure.toFixed(2)
        );

    }


    // ==================================================
    // GET POSITION ATR
    // ==================================================

    getPositionATR(position) {

        if (!position) {

            return null;

        }


        const storedAtr =
            Number(
                position.atr
            );


        if (
            Number.isFinite(storedAtr) &&
            storedAtr > 0
        ) {

            return storedAtr;

        }


        const exchange =
            position.exchange;

        const symbol =
            position.symbol;

        const timeframe =
            position.timeframe;


        if (
            !exchange ||
            !symbol ||
            !timeframe
        ) {

            return null;

        }


        try {

            const atrData =
                IndicatorStore.get(
                    exchange,
                    symbol,
                    timeframe,
                    "ATR"
                );


            if (
                atrData === null ||
                atrData === undefined
            ) {

                return null;

            }


            const atrValue =
                typeof atrData === "object"
                    ? atrData?.value
                    : atrData;


            const numericAtr =
                Number(
                    atrValue
                );


            if (
                !Number.isFinite(numericAtr) ||
                numericAtr <= 0
            ) {

                return null;

            }


            return numericAtr;

        }
        catch (error) {

            console.error(
                "❌ POSITION ATR READ ERROR:",
                error?.message || error
            );

            return null;

        }

    }


    // ==================================================
    // GET TRAILING ATR
    // ==================================================

    getTrailingATR(position) {

        const exchange =
            position?.exchange;

        const symbol =
            position?.symbol;

        const timeframe =
            position?.timeframe;


        if (
            !exchange ||
            !symbol ||
            !timeframe
        ) {

            return null;

        }


        try {

            const atrData =
                IndicatorStore.get(
                    exchange,
                    symbol,
                    timeframe,
                    "TRAILING_ATR"
                );


            if (
                atrData === null ||
                atrData === undefined
            ) {

                return null;

            }


            const atrValue =
                typeof atrData === "object"
                    ? atrData?.value
                    : atrData;


            const numericAtr =
                Number(
                    atrValue
                );


            if (
                !Number.isFinite(numericAtr) ||
                numericAtr <= 0
            ) {

                return null;

            }


            return numericAtr;

        }
        catch (error) {

            console.error(
                "❌ TRAILING ATR READ ERROR:",
                error?.message || error
            );

            return null;

        }

    }


    // ==================================================
    // ADD POSITION
    // ==================================================

    async add(position) {

        return await this.runOpenPositionLock(

            async () => {

                if (!position) {

                    return null;

                }


                const entryPrice =
                    Number(
                        position.entryPrice ?? 0
                    );


                const quantity =
                    Number(
                        position.quantity ?? 0
                    );


                if (
                    !Number.isFinite(entryPrice) ||
                    entryPrice <= 0 ||
                    !Number.isFinite(quantity) ||
                    quantity <= 0
                ) {

                    return null;

                }


                const mode =
                    String(
                        position.mode ?? "PAPER"
                    )
                    .trim()
                    .toUpperCase() === "LIVE"
                        ? "LIVE"
                        : "PAPER";


                const normalizedSymbol =
                    String(
                        position.symbol ?? ""
                    )
                    .trim()
                    .toUpperCase();


                if (!normalizedSymbol) {

                    return null;

                }


                if (
                    this.hasOpenPosition(
                        normalizedSymbol
                    )
                ) {

                    console.warn(
                        "⚠️ DUPLICATE OPEN POSITION BLOCKED:",
                        {
                            symbol:
                                normalizedSymbol,

                            mode
                        }
                    );

                    return null;

                }


                const positionCode =
                    String(
                        position.positionCode ??
                        this.generatePositionCode()
                    )
                    .trim();


                if (
                    this.hasPositionCode(
                        positionCode
                    )
                ) {

                    console.warn(
                        "⚠️ DUPLICATE POSITION CODE BLOCKED:",
                        {
                            positionCode,
                            symbol:
                                normalizedSymbol
                        }
                    );

                    return null;

                }


                const openedAt =
                    position.openedAt ??
                    new Date().toISOString();


                const normalizedSide =
                    String(
                        position.side ?? ""
                    )
                    .trim()
                    .toUpperCase();


                const trailingSettings =
                    position.trailingSettings ??
                    riskSettings.trailing ??
                    null;


                let positionAtr = null;


                if (
                    position.atr !== null &&
                    position.atr !== undefined &&
                    Number.isFinite(
                        Number(position.atr)
                    ) &&
                    Number(position.atr) > 0
                ) {

                    positionAtr =
                        Number(position.atr);

                }
                else {

                    const atrData =
                        IndicatorStore.get(
                            position.exchange,
                            normalizedSymbol,
                            position.timeframe,
                            "ATR"
                        );


                    if (
                        atrData !== null &&
                        atrData !== undefined
                    ) {

                        const atrValue =
                            typeof atrData === "object"
                                ? atrData?.value
                                : atrData;


                        if (
                            Number.isFinite(
                                Number(atrValue)
                            ) &&
                            Number(atrValue) > 0
                        ) {

                            positionAtr =
                                Number(atrValue);

                        }

                    }

                }


                const newPosition = {

                    id:
                        position.id ??
                        crypto.randomUUID(),

                    positionCode,

                    exchange:
                        position.exchange ?? null,

                    symbol:
                        normalizedSymbol,

                    side:
                        normalizedSide,

                    action:
                        position.action ?? "OPEN",

                    mode,

                    status:
                        "OPEN",

                    entryPrice,

                    quantity,

                    leverage:
                        Number(
                            position.leverage ?? 1
                        ),

                    stopLoss:
                        position.stopLoss ?? null,

                    takeProfit:
                        position.takeProfit ?? null,

                    riskAmount:
                        Number(
                            position.riskAmount ?? 0
                        ),

                    trailing:
                        position.trailing ?? null,

                    atr:
                        positionAtr,

                    trailingSettings,

                    orderType:
                        position.orderType ?? "MARKET",

                    timeframe:
                        position.timeframe ?? null,

                    confidence:
                        position.confidence ?? null,

                    signalId:
                        position.signalId ?? null,

                    openedAt,

                    closedAt:
                        null,

                    currentPrice:
                        entryPrice,

                    highestPrice:
                        entryPrice,

                    lowestPrice:
                        entryPrice,

                    pnl: {

                        value: 0,

                        percent: 0

                    },

                    exitPrice:
                        null,

                    reason:
                        null,

                    fees:
                        Number(
                            position.fees ?? 0
                        ),

                    marginReserved:
                        mode === "PAPER"

                };


                this.positions.push(
                    newPosition
                );


                try {

                    const saved =
                        await this.repository.create({

                            id:
                                newPosition.id,

                            position_code:
                                newPosition.positionCode,

                            exchange:
                                newPosition.exchange,

                            symbol:
                                newPosition.symbol,

                            side:
                                newPosition.side,

                            status:
                                newPosition.status,

                            entry_price:
                                newPosition.entryPrice,

                            quantity:
                                newPosition.quantity,

                            leverage:
                                newPosition.leverage,

                            stop_loss:
                                newPosition.stopLoss,

                            take_profit:
                                newPosition.takeProfit,

                            timeframe:
                                newPosition.timeframe,

                            confidence:
                                newPosition.confidence,

                            signal_id:
                                newPosition.signalId,

                            opened_at:
                                newPosition.openedAt,

                            closed_at:
                                null,

                            exit_price:
                                null,

                            reason:
                                null,

                            pnl_value:
                                0,

                            pnl_percent:
                                0,

                            mode:
                                newPosition.mode,

                            action:
                                newPosition.action,

                            trailing:
                                newPosition.trailing,

                            atr:
                                newPosition.atr,

                            trailing_settings:
                                newPosition.trailingSettings,

                            order_type:
                                newPosition.orderType,

                            risk_amount:
                                newPosition.riskAmount,

                            current_price:
                                newPosition.currentPrice,

                            highest_price:
                                newPosition.highestPrice,

                            lowest_price:
                                newPosition.lowestPrice,

                            fees:
                                newPosition.fees

                        });


                    if (!saved) {

                        console.error(
                            "⚠️ POSITION DATABASE CREATE RETURNED EMPTY"
                        );

                    }

                }
                catch (error) {

                    console.error(
                        "❌ POSITION DATABASE SAVE ERROR:",
                        error?.message || error
                    );

                }


                await this.syncPaperAccount();


                return newPosition;

            }

        );

    }


    // ======================================================
    // GET CHANDELIER LOOKBACK HIGH / LOW
    // ======================================================

    getChandelierLookback(position) {

        const settings =
            position?.trailingSettings ??
            riskSettings.trailing ??
            null;


        if (
            !settings ||
            String(settings.mode ?? "")
                .trim()
                .toUpperCase() !== "CHANDELIER"
        ) {

            return {

                highestHigh: null,

                lowestLow: null,

                candleCount: 0

            };

        }


        const lookback =
            Math.max(
                1,
                Math.floor(
                    Number(
                        settings.chandelierLookback ?? 22
                    )
                )
            );


        const symbol =
            position?.symbol;


        const timeframe =
            position?.timeframe;


        if (
            !symbol ||
            !timeframe
        ) {

            return {

                highestHigh: null,

                lowestLow: null,

                candleCount: 0

            };

        }


        const candleStore =
            this.candleStore;


        if (
            !candleStore ||
            typeof candleStore.get !== "function"
        ) {

            return {

                highestHigh: null,

                lowestLow: null,

                candleCount: 0

            };

        }


        const candles =
            candleStore.get(
                symbol,
                timeframe
            );


        if (
            !Array.isArray(candles) ||
            candles.length === 0
        ) {

            return {

                highestHigh: null,

                lowestLow: null,

                candleCount: 0

            };

        }


        const recentCandles =
            candles.slice(-lookback);


        let highestHigh =
            null;


        let lowestLow =
            null;


        for (
            const candle
            of recentCandles
        ) {

            const high =
                Number(
                    candle?.high
                );


            const low =
                Number(
                    candle?.low
                );


            if (
                Number.isFinite(high)
            ) {

                highestHigh =
                    highestHigh === null
                        ? high
                        : Math.max(
                            highestHigh,
                            high
                        );

            }


            if (
                Number.isFinite(low)
            ) {

                lowestLow =
                    lowestLow === null
                        ? low
                        : Math.min(
                            lowestLow,
                            low
                        );

            }

        }


        return {

            highestHigh,

            lowestLow,

            candleCount:
                recentCandles.length

        };

    }


    // ==================================================
    // RESERVE PAPER MARGIN
    // ==================================================

    async reservePaperMargin(position) {

        console.warn(
            "⚠️ reservePaperMargin() is deprecated. " +
            "Paper margin is reserved by OrderExecutor."
        );


        try {

            await PaperAccountStore.ready;


            const account =
                PaperAccountStore.getByExchange(
                    position.exchange
                );


            if (!account) {

                console.error(
                    "❌ PAPER ACCOUNT NOT FOUND:",
                    position.exchange
                );

                return false;

            }


            const margin =
                this.calculateMargin(
                    position
                );


            if (margin <= 0) {

                return false;

            }


            position.marginReserved =
                true;


            return true;

        }
        catch (error) {

            console.error(
                "❌ PAPER MARGIN RESERVATION ERROR:",
                error?.message || error
            );

            return false;

        }

    }


    // ==================================================
    // RELEASE PAPER MARGIN
    // ==================================================

    async releasePaperMargin(position) {

        try {

            if (
                !position ||
                position.mode !== "PAPER" ||
                !position.marginReserved
            ) {

                return;

            }


            position.marginReserved =
                false;


            await this.syncPaperAccount();

        }
        catch (error) {

            console.error(
                "❌ PAPER MARGIN RELEASE ERROR:",
                error?.message || error
            );

        }

    }


    // ==================================================
    // UPDATE PRICE
    // ==================================================

    async updatePrice(
        symbol,
        price
    ) {

        const numericPrice =
            Number(price);


        if (
            !Number.isFinite(
                numericPrice
            ) ||
            numericPrice <= 0
        ) {

            return;

        }


        const normalizedSymbol =
            String(
                symbol ?? ""
            )
            .trim()
            .toUpperCase();


        let changed = false;


        for (
            const position
            of this.positions
        ) {

            if (
                position.status !== "OPEN"
            ) {

                continue;

            }


            if (
                String(
                    position.symbol ?? ""
                )
                .trim()
                .toUpperCase() !==
                normalizedSymbol
            ) {

                continue;

            }


            position.currentPrice =
                numericPrice;


            if (
                numericPrice >
                Number(
                    position.highestPrice
                )
            ) {

                position.highestPrice =
                    numericPrice;

            }


            if (
                numericPrice <
                Number(
                    position.lowestPrice
                )
            ) {

                position.lowestPrice =
                    numericPrice;

            }


            position.pnl =
                this.calculatePnL(
                    position,
                    numericPrice
                );


            // ==================================================
            // ENSURE TRAILING SETTINGS
            // ==================================================

            if (
                !position.trailingSettings
            ) {

                position.trailingSettings =
                    riskSettings.trailing ??
                    null;

            }


            // ==================================================
            // ENSURE ATR
            // ==================================================

            const currentAtr =
                this.getPositionATR(
                    position
                );


            if (
                currentAtr !== null
            ) {

                position.atr =
                    currentAtr;

            }


            // ==================================================
            // CHANDELIER LOOKBACK
            // ==================================================

            let trailingHighestPrice =
                position.highestPrice;


            let trailingLowestPrice =
                position.lowestPrice;


            const chandelierLookback =
                this.getChandelierLookback(
                    position
                );


            if (
                chandelierLookback.candleCount > 0
            ) {

                if (
                    chandelierLookback.highestHigh !== null
                ) {

                    trailingHighestPrice =
                        chandelierLookback.highestHigh;

                }


                if (
                    chandelierLookback.lowestLow !== null
                ) {

                    trailingLowestPrice =
                        chandelierLookback.lowestLow;

                }

            }


            // ==================================================
            // TRAILING ATR
            //
            // Stop Loss ATR و Trailing ATR جدا هستند.
            //
            // position.atr = ATR مربوط به Stop Loss
            // TRAILING_ATR = ATR مربوط به Chandelier
            // ==================================================

            const trailingMode =
                String(
                    position.trailingSettings?.mode ?? ""
                )
                .trim()
                .toUpperCase();


            const trailingAtr =
                trailingMode === "CHANDELIER"
                    ? this.getTrailingATR(position)
                    : position.atr;

                    


            const trailingResult =
                TrailingStopEngine.calculate({

                    side:
                        position.side,

                    entryPrice:
                        position.entryPrice,

                    currentPrice:
                        numericPrice,

                    highestPrice:
                        trailingHighestPrice,

                    lowestPrice:
                        trailingLowestPrice,

                    atr:
                        trailingAtr ?? null,

                    settings:
                        position.trailingSettings

                });


            if (
                trailingResult?.active
            ) {

                position.trailing =
                    {

                        ...trailingResult,

                        lookback:
                            position.trailingSettings
                                ?.chandelierLookback ??
                            null,

                        lookbackCandleCount:
                            chandelierLookback.candleCount

                    };


                // ==================================================
                // PROTECT CURRENT STOP LOSS
                //
                // LONG:
                // Trailing Stop فقط می‌تواند SL را بالاتر ببرد.
                //
                // SHORT:
                // Trailing Stop فقط می‌تواند SL را پایین‌تر ببرد.
                //
                // ==================================================

                const trailingStop =
                    Number(
                        trailingResult.stopPrice
                    );


                const currentStopLoss =
                    Number(
                        position.stopLoss
                    );


                const stopLossBefore =
                    Number.isFinite(currentStopLoss) &&
                    currentStopLoss > 0
                        ? currentStopLoss
                        : null;


                let finalStopLoss =
                    stopLossBefore;


                if (
                    Number.isFinite(trailingStop) &&
                    trailingStop > 0
                ) {

                    // ==================================================
                    // LONG
                    //
                    // Trailing Stop باید پایین‌تر از قیمت فعلی باشد.
                    // اگر بالاتر یا مساوی قیمت فعلی باشد،
                    // اجازه نداریم آن را به Stop Loss تبدیل کنیم.
                    // ==================================================

                    if (
                        position.side === "LONG"
                    ) {

                        if (
                            trailingStop < numericPrice
                        ) {

                            finalStopLoss =
                                stopLossBefore !== null
                                    ? Math.max(
                                        stopLossBefore,
                                        trailingStop
                                    )
                                    : trailingStop;


                            position.stopLoss =
                                finalStopLoss;

                        }

                    }


                    // ==================================================
                    // SHORT
                    //
                    // Trailing Stop باید بالاتر از قیمت فعلی باشد.
                    // اگر پایین‌تر یا مساوی قیمت فعلی باشد،
                    // اجازه نداریم آن را به Stop Loss تبدیل کنیم.
                    // ==================================================

                    else if (
                        position.side === "SHORT"
                    ) {

                        if (
                            trailingStop > numericPrice
                        ) {

                            finalStopLoss =
                                stopLossBefore !== null
                                    ? Math.min(
                                        stopLossBefore,
                                        trailingStop
                                    )
                                    : trailingStop;


                            position.stopLoss =
                                finalStopLoss;

                        }

                    }


                    // ==================================================
                    // OTHER SIDE
                    // ==================================================

                    else {

                        position.stopLoss =
                            trailingStop;

                    }

                }


            }


            changed = true;

        }


        if (!changed) {

            return;

        }


        for (
            const position
            of this.positions
        ) {

            if (
                position.status !== "OPEN" ||
                String(
                    position.symbol ?? ""
                )
                .trim()
                .toUpperCase() !==
                normalizedSymbol
            ) {

                continue;

            }


            try {

                await this.repository.update(

                    position.id,

                    {

                        current_price:
                            position.currentPrice,

                        highest_price:
                            position.highestPrice,

                        lowest_price:
                            position.lowestPrice,

                        stop_loss:
                            position.stopLoss,

                        take_profit:
                            position.takeProfit,

                        trailing:
                            position.trailing,

                        atr:
                            position.atr,

                        trailing_settings:
                            position.trailingSettings,

                        pnl_value:
                            position.pnl?.value ?? 0,

                        pnl_percent:
                            position.pnl?.percent ?? 0,

                        fees:
                            position.fees ?? 0

                    }

                );

            }
            catch (error) {

                console.error(
                    "❌ POSITION PRICE PERSIST ERROR:",
                    error?.message || error
                );

            }

        }


        await this.syncPaperAccount();

    }


    // ==================================================
    // SYNC PAPER ACCOUNT
    // ==================================================

    async syncPaperAccount() {

        try {

            await PaperAccountStore.ready;


            const accounts =
                PaperAccountStore.getAll();


            if (
                !Array.isArray(accounts)
            ) {

                return;

            }


            for (
                const account
                of accounts
            ) {

                const accountExchange =
                    String(
                        account.exchange ?? ""
                    )
                    .trim()
                    .toUpperCase();


                const openPositions =
                    this.positions.filter(

                        position =>

                            position.status === "OPEN" &&

                            position.mode === "PAPER" &&

                            String(
                                position.exchange ?? ""
                            )
                            .trim()
                            .toUpperCase() ===
                            accountExchange

                    );


                const balance =
                    Number(
                        account.balance ?? 0
                    );


                let unrealizedPnl = 0;

                let positionExposure = 0;

                let usedMargin = 0;


                for (
                    const position
                    of openPositions
                ) {

                    const currentPrice =
                        Number(
                            position.currentPrice
                        );


                    const validPrice =
                        Number.isFinite(
                            currentPrice
                        ) &&
                        currentPrice > 0
                            ? currentPrice
                            : Number(
                                position.entryPrice
                            );


                    position.currentPrice =
                        validPrice;


                    position.pnl =
                        this.calculatePnL(
                            position,
                            validPrice
                        );


                    unrealizedPnl +=
                        Number(
                            position.pnl?.value ?? 0
                        );


                    positionExposure +=
                        this.calculatePositionExposure(
                            position
                        );


                    usedMargin +=
                        this.calculateMargin(
                            position
                        );


                    position.marginReserved =
                        true;

                }


                unrealizedPnl =
                    Number(
                        unrealizedPnl.toFixed(2)
                    );


                positionExposure =
                    Number(
                        positionExposure.toFixed(2)
                    );


                usedMargin =
                    Number(
                        usedMargin.toFixed(2)
                    );


                const equity =
                    Number(
                        (
                            balance +
                            unrealizedPnl
                        ).toFixed(2)
                    );


                const availableBalance =
                    Number(
                        Math.max(
                            0,
                            equity -
                            usedMargin
                        ).toFixed(2)
                    );


                const realizedPnl =
                    Number(
                        account.realizedPnl ?? 0
                    );


                const totalPnl =
                    Number(
                        (
                            realizedPnl +
                            unrealizedPnl
                        ).toFixed(2)
                    );


                const fees =
                    Number(
                        account.fees ?? 0
                    );


                const fundingFees =
                    Number(
                        account.fundingFees ?? 0
                    );


                await PaperAccountStore.update(

                    account.id,

                    {

                        balance,

                        equity,

                        usedMargin,

                        availableBalance,

                        positionExposure,

                        unrealizedPnl,

                        realizedPnl,

                        totalPnl,

                        fees,

                        fundingFees

                    }

                );

            }

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT SYNC ERROR:",
                error?.message || error
            );

        }

    }


    // ==================================================
    // REBUILD PAPER ACCOUNTS
    // ==================================================

    async rebuildPaperAccounts() {

        try {

            await PaperAccountStore.ready;


            const accounts =
                PaperAccountStore.getAll();


            if (
                !Array.isArray(accounts)
            ) {

                return;

            }


            for (
                const account
                of accounts
            ) {

                const accountExchange =
                    String(
                        account.exchange ?? ""
                    )
                    .trim()
                    .toUpperCase();


                const closedPaperPositions =
                    this.positions.filter(

                        position =>

                            position.status === "CLOSED" &&

                            position.mode === "PAPER" &&

                            String(
                                position.exchange ?? ""
                            )
                            .trim()
                            .toUpperCase() ===
                            accountExchange

                    );


                account.totalTrades = 0;
                account.winningTrades = 0;
                account.losingTrades = 0;

                account.grossProfit = 0;
                account.grossLoss = 0;

                account.averageProfit = 0;
                account.averageLoss = 0;

                account.largestProfit = 0;
                account.largestLoss = 0;

                account.consecutiveWins = 0;
                account.consecutiveLosses = 0;

                account.winRate = 0;
                account.profitFactor = 0;

                account.realizedPnl = 0;

                account.todayPnl = 0;
                account.weeklyPnl = 0;
                account.monthlyPnl = 0;


                let totalFees = 0;


                closedPaperPositions.sort(

                    (a, b) => {

                        const aTime =
                            new Date(
                                a.closedAt ??
                                a.openedAt ??
                                0
                            ).getTime();

                        const bTime =
                            new Date(
                                b.closedAt ??
                                b.openedAt ??
                                0
                            ).getTime();

                        return aTime - bTime;

                    }

                );


                for (
                    const position
                    of closedPaperPositions
                ) {

                    const pnl =
                        Number(
                            position.pnl?.value ?? 0
                        );


                    const fees =
                        Number(
                            position.fees ?? 0
                        );


                    if (
                        !Number.isFinite(pnl)
                    ) {

                        continue;

                    }


                    const netPnl =
                        Number(
                            (
                                pnl -
                                fees
                            ).toFixed(2)
                        );


                    totalFees +=
                        Number.isFinite(fees)
                            ? fees
                            : 0;


                    account.totalTrades += 1;


                    account.realizedPnl =
                        Number(
                            (
                                account.realizedPnl +
                                netPnl
                            ).toFixed(2)
                        );


                    if (
                        netPnl > 0
                    ) {

                        account.winningTrades += 1;

                        account.grossProfit =
                            Number(
                                (
                                    account.grossProfit +
                                    netPnl
                                ).toFixed(2)
                            );


                        account.largestProfit =
                            Math.max(
                                account.largestProfit,
                                netPnl
                            );


                        account.consecutiveWins += 1;

                        account.consecutiveLosses = 0;

                    }
                    else if (
                        netPnl < 0
                    ) {

                        account.losingTrades += 1;

                        account.grossLoss =
                            Number(
                                (
                                    account.grossLoss +
                                    Math.abs(netPnl)
                                ).toFixed(2)
                            );


                        account.largestLoss =
                            Math.max(
                                account.largestLoss,
                                Math.abs(netPnl)
                            );


                        account.consecutiveLosses += 1;

                        account.consecutiveWins = 0;

                    }


                    const closedAt =
                        position.closedAt
                            ? new Date(
                                position.closedAt
                            )
                            : null;


                    if (
                        closedAt &&
                        !Number.isNaN(
                            closedAt.getTime()
                        )
                    ) {

                        const now =
                            new Date();


                        const sameDay =
                            now.toDateString() ===
                            closedAt.toDateString();


                        if (
                            sameDay
                        ) {

                            account.todayPnl =
                                Number(
                                    (
                                        account.todayPnl +
                                        netPnl
                                    ).toFixed(2)
                                );

                        }


                        const currentWeekStart =
                            new Date(now);

                        currentWeekStart.setHours(
                            0,
                            0,
                            0,
                            0
                        );

                        currentWeekStart.setDate(
                            now.getDate() -
                            now.getDay()
                        );


                        const tradeWeekStart =
                            new Date(closedAt);

                        tradeWeekStart.setHours(
                            0,
                            0,
                            0,
                            0
                        );

                        tradeWeekStart.setDate(
                            closedAt.getDate() -
                            closedAt.getDay()
                        );


                        if (
                            currentWeekStart.getTime() ===
                            tradeWeekStart.getTime()
                        ) {

                            account.weeklyPnl =
                                Number(
                                    (
                                        account.weeklyPnl +
                                        netPnl
                                    ).toFixed(2)
                                );

                        }


                        const sameMonth =
                            now.getFullYear() ===
                            closedAt.getFullYear() &&
                            now.getMonth() ===
                            closedAt.getMonth();


                        if (
                            sameMonth
                        ) {

                            account.monthlyPnl =
                                Number(
                                    (
                                        account.monthlyPnl +
                                        netPnl
                                    ).toFixed(2)
                                );

                        }

                    }

                }


                account.averageProfit =
                    account.winningTrades > 0
                        ? Number(
                            (
                                account.grossProfit /
                                account.winningTrades
                            ).toFixed(2)
                        )
                        : 0;


                account.averageLoss =
                    account.losingTrades > 0
                        ? Number(
                            (
                                account.grossLoss /
                                account.losingTrades
                            ).toFixed(2)
                        )
                        : 0;


                account.winRate =
                    account.totalTrades > 0
                        ? Number(
                            (
                                (
                                    account.winningTrades /
                                    account.totalTrades
                                ) *
                                100
                            ).toFixed(2)
                        )
                        : 0;


                account.profitFactor =
                    account.grossLoss > 0
                        ? Number(
                            (
                                account.grossProfit /
                                account.grossLoss
                            ).toFixed(2)
                        )
                        : 0;


                account.fees =
                    Number(
                        totalFees.toFixed(2)
                    );

            }


            await this.syncPaperAccount();


            for (
                const account
                of accounts
            ) {

                await PaperAccountStore.update(

                    account.id,

                    {

                        totalTrades:
                            account.totalTrades,

                        winningTrades:
                            account.winningTrades,

                        losingTrades:
                            account.losingTrades,

                        winRate:
                            account.winRate,

                        profitFactor:
                            account.profitFactor,

                        averageProfit:
                            account.averageProfit,

                        averageLoss:
                            account.averageLoss,

                        largestProfit:
                            account.largestProfit,

                        largestLoss:
                            account.largestLoss,

                        consecutiveWins:
                            account.consecutiveWins,

                        consecutiveLosses:
                            account.consecutiveLosses,

                        grossProfit:
                            account.grossProfit,

                        grossLoss:
                            account.grossLoss,

                        realizedPnl:
                            account.realizedPnl,

                        todayPnl:
                            account.todayPnl,

                        weeklyPnl:
                            account.weeklyPnl,

                        monthlyPnl:
                            account.monthlyPnl,

                        fees:
                            account.fees

                    }

                );

            }


            for (
                const position
                of this.positions
            ) {

                if (
                    position.status !== "OPEN" ||
                    position.mode !== "PAPER"
                ) {

                    continue;

                }


                try {

                    await this.repository.update(

                        position.id,

                        {

                            current_price:
                                position.currentPrice,

                            highest_price:
                                position.highestPrice,

                            lowest_price:
                                position.lowestPrice,

                            pnl_value:
                                position.pnl?.value ?? 0,

                            pnl_percent:
                                position.pnl?.percent ?? 0,

                            stop_loss:
                                position.stopLoss,

                            take_profit:
                                position.takeProfit,

                            trailing:
                                position.trailing,

                            atr:
                                position.atr,

                            trailing_settings:
                                position.trailingSettings,

                            fees:
                                position.fees ?? 0

                        }

                    );

                }
                catch (error) {

                    console.error(
                        "❌ PAPER POSITION REBUILD PERSIST ERROR:",
                        error?.message || error
                    );

                }

            }


            console.log(
                "🟢 PAPER ACCOUNTS REBUILT FROM POSITIONS"
            );

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT REBUILD ERROR:",
                error?.message || error
            );

        }

    }


    // ==================================================
    // CALCULATE PNL
    // ==================================================

    calculatePnL(
        position,
        price
    ) {

        const entryPrice =
            Number(
                position?.entryPrice
            );

        const quantity =
            Number(
                position?.quantity
            );

        const currentPrice =
            Number(price);


        if (
            !Number.isFinite(entryPrice) ||
            entryPrice <= 0 ||
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(currentPrice) ||
            currentPrice <= 0
        ) {

            return {

                value: 0,

                percent: 0

            };

        }


        const side =
            String(
                position?.side ?? ""
            )
            .trim()
            .toUpperCase();


        let priceDifference = 0;


        if (
            side === "LONG"
        ) {

            priceDifference =
                currentPrice -
                entryPrice;

        }
        else if (
            side === "SHORT"
        ) {

            priceDifference =
                entryPrice -
                currentPrice;

        }
        else {

            console.error(
                "❌ INVALID POSITION SIDE FOR PNL:",
                {
                    side,
                    entryPrice,
                    currentPrice,
                    quantity
                }
            );

            return {

                value: 0,

                percent: 0

            };

        }


        const value =
            priceDifference *
            quantity;


        const percent =
            (
                priceDifference /
                entryPrice
            ) *
            100;


        return {

            value:
                Number(
                    value.toFixed(2)
                ),

            percent:
                Number(
                    percent.toFixed(2)
                )

        };

    }


    // ==================================================
    // UPDATE POSITION
    // ==================================================

    async update(position) {

        if (
            !position ||
            !position.id
        ) {

            return null;

        }


        const index =
            this.positions.findIndex(
                p =>
                    p.id === position.id
            );


        if (index === -1) {

            return null;

        }


        this.positions[index] = {

            ...this.positions[index],

            ...position

        };


        const current =
            this.positions[index];


        try {

            await this.repository.update(

                position.id,

                {

                    status:
                        current.status,

                    action:
                        current.action,

                    stop_loss:
                        current.stopLoss,

                    take_profit:
                        current.takeProfit,

                    trailing:
                        current.trailing,

                    atr:
                        current.atr,

                    trailing_settings:
                        current.trailingSettings,

                    order_type:
                        current.orderType,

                    risk_amount:
                        current.riskAmount,

                    current_price:
                        current.currentPrice,

                    highest_price:
                        current.highestPrice,

                    lowest_price:
                        current.lowestPrice,

                    exit_price:
                        current.exitPrice,

                    reason:
                        current.reason,

                    closed_at:
                        current.closedAt,

                    pnl_value:
                        current.pnl?.value ?? 0,

                    pnl_percent:
                        current.pnl?.percent ?? 0,

                    fees:
                        current.fees ?? 0,

                    mode:
                        current.mode

                }

            );

        }
        catch (error) {

            console.error(
                "❌ POSITION DATABASE UPDATE ERROR:",
                error?.message || error
            );

        }


        if (
            current.mode === "PAPER"
        ) {

            await this.syncPaperAccount();

        }


        return current;

    }


    // ==================================================
    // CLOSE POSITION
    // ==================================================

    async close(
        id,
        exitPrice,
        reason = null,
        fees = 0
    ) {

        const position =
            this.getById(id);


        if (!position) {

            return null;

        }


        if (
            position.status === "CLOSED"
        ) {

            return position;

        }


        const numericExitPrice =
            Number(exitPrice);


        if (
            !Number.isFinite(
                numericExitPrice
            ) ||
            numericExitPrice <= 0
        ) {

            return null;

        }


        // Keep the in-memory state unchanged if persistence fails.
        const previousState = {
            exitPrice: position.exitPrice,
            currentPrice: position.currentPrice,
            pnl: position.pnl,
            fees: position.fees,
            status: position.status,
            closedAt: position.closedAt,
            reason: position.reason
        };

        position.exitPrice =
            numericExitPrice;


        position.currentPrice =
            numericExitPrice;


        position.pnl =
            this.calculatePnL(
                position,
                numericExitPrice
            );


        position.fees =
            Number(
                fees || 0
            );


        console.log(
            "🔴 FINAL POSITION CLOSE:",
            {
                positionCode:
                    position.positionCode,

                side:
                    position.side,

                entryPrice:
                    position.entryPrice,

                exitPrice:
                    numericExitPrice,

                quantity:
                    position.quantity,

                pnl:
                    position.pnl,

                fees:
                    position.fees
            }
        );


        position.status =
            "CLOSED";


        position.closedAt =
            new Date().toISOString();


        position.reason =
            reason ??
            position.reason ??
            this.detectCloseReason(
                position
            );


        try {

            const persistedPosition = await this.repository.update(

                position.id,

                {

                    status:
                        position.status,

                    action:
                        position.action,

                    stop_loss:
                        position.stopLoss,

                    take_profit:
                        position.takeProfit,

                    trailing:
                        position.trailing,

                    atr:
                        position.atr,

                    trailing_settings:
                        position.trailingSettings,

                    order_type:
                        position.orderType,

                    risk_amount:
                        position.riskAmount,

                    current_price:
                        position.currentPrice,

                    highest_price:
                        position.highestPrice,

                    lowest_price:
                        position.lowestPrice,

                    exit_price:
                        position.exitPrice,

                    reason:
                        position.reason,

                    closed_at:
                        position.closedAt,

                    pnl_value:
                        position.pnl?.value ?? 0,

                    pnl_percent:
                        position.pnl?.percent ?? 0,

                    fees:
                        position.fees,

                    mode:
                        position.mode

                }

            );

            if (!persistedPosition) {
                Object.assign(position, previousState);
                return null;
            }
        catch (error) {

            Object.assign(position, previousState);

            console.error(
                "❌ POSITION DATABASE CLOSE UPDATE ERROR:",
                error?.message || error
            );

            return null;

        }


        await this.syncPaperAccount();


        return position;

    }


    // ==================================================
    // SETTLE PAPER CLOSE
    // ==================================================

    async settlePaperClose(
        position
    ) {

        try {

            await PaperAccountStore.ready;


            const account =
                PaperAccountStore.getByExchange(
                    position.exchange
                );


            if (!account) {

                console.error(
                    "❌ PAPER SETTLEMENT ACCOUNT NOT FOUND:",
                    position.exchange
                );

                return;

            }


            const finalPnl =
                this.calculatePnL(
                    position,
                    position.exitPrice
                );


            position.pnl =
                finalPnl;


            const pnl =
                Number(
                    finalPnl.value
                );


            const fees =
                Number(
                    position.fees ?? 0
                );


            const currentBalance =
                Number(
                    account.balance ?? 0
                );


            const currentRealizedPnl =
                Number(
                    account.realizedPnl ?? 0
                );


            const currentFees =
                Number(
                    account.fees ?? 0
                );


            const newBalance =
                Number(
                    (
                        currentBalance +
                        pnl -
                        fees
                    ).toFixed(2)
                );


            const newRealizedPnl =
                Number(
                    (
                        currentRealizedPnl +
                        pnl -
                        fees
                    ).toFixed(2)
                );


            const newFees =
                Number(
                    (
                        currentFees +
                        fees
                    ).toFixed(2)
                );


            const openPaperPositions =
                this.positions.filter(

                    p =>

                        p.id !== position.id &&

                        p.status === "OPEN" &&

                        p.mode === "PAPER" &&

                        String(
                            p.exchange ?? ""
                        )
                        .trim()
                        .toUpperCase() ===
                        String(
                            position.exchange ?? ""
                        )
                        .trim()
                        .toUpperCase()

                );


            let unrealizedPnl = 0;

            let positionExposure = 0;

            let calculatedUsedMargin = 0;


            for (
                const openPosition
                of openPaperPositions
            ) {

                openPosition.pnl =
                    this.calculatePnL(
                        openPosition,
                        openPosition.currentPrice
                    );


                unrealizedPnl +=
                    Number(
                        openPosition.pnl?.value ?? 0
                    );


                positionExposure +=
                    this.calculatePositionExposure(
                        openPosition
                    );


                calculatedUsedMargin +=
                    this.calculateMargin(
                        openPosition
                    );

            }


            unrealizedPnl =
                Number(
                    unrealizedPnl.toFixed(2)
                );


            positionExposure =
                Number(
                    positionExposure.toFixed(2)
                );


            calculatedUsedMargin =
                Number(
                    calculatedUsedMargin.toFixed(2)
                );


            const newEquity =
                Number(
                    (
                        newBalance +
                        unrealizedPnl
                    ).toFixed(2)
                );


            const newAvailableBalance =
                Number(
                    Math.max(
                        0,
                        newEquity -
                        calculatedUsedMargin
                    ).toFixed(2)
                );


            const newTotalPnl =
                Number(
                    (
                        newRealizedPnl +
                        unrealizedPnl
                    ).toFixed(2)
                );


            console.log(
                "💰 PAPER CLOSE SETTLEMENT:",
                {

                    positionCode:
                        position.positionCode,

                    pnl,

                    fees,

                    oldBalance:
                        currentBalance,

                    newBalance,

                    realizedPnl:
                        newRealizedPnl,

                    unrealizedPnl,

                    equity:
                        newEquity,

                    usedMargin:
                        calculatedUsedMargin,

                    availableBalance:
                        newAvailableBalance,

                    positionExposure,

                    totalPnl:
                        newTotalPnl

                }
            );


            await PaperAccountStore.update(

                account.id,

                {

                    balance:
                        newBalance,

                    equity:
                        newEquity,

                    availableBalance:
                        newAvailableBalance,

                    usedMargin:
                        calculatedUsedMargin,

                    positionExposure,

                    unrealizedPnl,

                    realizedPnl:
                        newRealizedPnl,

                    totalPnl:
                        newTotalPnl,

                    fees:
                        newFees

                }

            );


            await PaperAccountStore.recordTrade(

                account.id,

                pnl,

                fees

            );


            position.marginReserved =
                false;

        }
        catch (error) {

            console.error(
                "❌ PAPER CLOSE SETTLEMENT ERROR:",
                error?.message || error
            );

        }

    }


    // ==================================================
    // DETECT CLOSE REASON
    // ==================================================

    detectCloseReason(position) {

        const exit =
            Number(
                position.exitPrice
            );


        const takeProfit =
            Number(
                position.takeProfit
            );


        const stopLoss =
            Number(
                position.stopLoss
            );


        if (
            Number.isFinite(takeProfit) &&
            exit === takeProfit
        ) {

            return "Take Profit";

        }


        if (
            Number.isFinite(stopLoss) &&
            exit === stopLoss
        ) {

            return "Stop Loss";

        }


        return "Manual";

    }


    // ==================================================
    // REMOVE
    // ==================================================

    async remove(id) {

        const position =
            this.getById(id);


        this.positions =
            this.positions.filter(
                position =>
                    position.id !== id
            );


        try {

            await this.repository.remove(
                id
            );

        }
        catch (error) {

            console.error(
                "❌ POSITION DATABASE REMOVE ERROR:",
                error?.message || error
            );

        }


        await this.syncPaperAccount();

    }


    // ==================================================
    // GET ALL
    // ==================================================

    getAll() {

        return this.positions;

    }


    // ==================================================
    // GET OPEN
    // ==================================================

    getOpenPositions() {

        return this.positions.filter(
            position =>
                position.status === "OPEN"
        );

    }


    // ==================================================
    // GET CLOSED
    // ==================================================

    getClosedPositions() {

        return this.positions.filter(
            position =>
                position.status === "CLOSED"
        );

    }


    // ==================================================
    // GET ONE
    // ==================================================

    getById(id) {

        return this.positions.find(
            position =>
                position.id === id
        );

    }


    // ==================================================
    // GET OPEN BY SYMBOL
    // ==================================================

    getOpenBySymbol(symbol) {

        const normalizedSymbol =
            String(
                symbol ?? ""
            )
            .trim()
            .toUpperCase();


        return this.positions.find(

            position =>

                String(
                    position.symbol ?? ""
                )
                .trim()
                .toUpperCase() ===
                normalizedSymbol &&

                position.status === "OPEN"

        );

    }

}


// ======================================================
// SINGLE INSTANCE
// ======================================================

const positionStore =
    new PositionStore();


export default positionStore;