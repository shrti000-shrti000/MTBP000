

import crypto from "crypto";
import fs from "fs";
import path from "path";

import TrailingStopEngine from "./TrailingStopEngine.js";

import PositionRepository from "../storage/repositories/PositionRepository.js";

import { exchangeManager } from "../exchange/exchangeManager.js";

// ======================================================
// STORE FILE
// ======================================================

const STORE_DIR = path.join(
    process.cwd(),
    "risk"
);

const STORE_FILE = path.join(
    STORE_DIR,
    "open-positions.json"
);

// ======================================================
// POSITION STORE
// ======================================================

class PositionStore {

    //constructor() {

       // this.positions = [];

       // this.ensureStorage();

       // this.load();

       // console.log(
        //    "🔥 POSITION STORE INSTANCE CREATED",
        //    new Date().toISOString(),
        //    "COUNT:",
        //    this.positions.length
        //);

    //}





    //constructor() {

   // this.positions = [];

   // this.ensureStorage();

   // this.load();

   // this.repository =
      //  PositionRepository;


   // console.log(
    //    "🔥 POSITION STORE INSTANCE CREATED",
    //    new Date().toISOString(),
     //   "COUNT:",
     //   this.positions.length
    //);

//}




//constructor() {

//    this.positions = [];

 //   this.repository =
  //      PositionRepository;

  //  this.ensureStorage();

    //this.load();


    //this.load();

//this.loadFromDatabase();


 //   console.log(
      //  "🔥 POSITION STORE INSTANCE CREATED",
     //   new Date().toISOString(),
     //   "COUNT:",
     //   this.positions.length
   // );

//}





constructor() {

    this.positions = [];

    this.repository =
        PositionRepository;

    this.ensureStorage();

    this.ready =
        this.loadFromDatabase();

    console.log(
        "🔥 POSITION STORE INSTANCE CREATED",
        new Date().toISOString()
    );
}




// ==================================================
// LOAD FROM DATABASE IF MEMORY EMPTY
// ==================================================

async loadFromDatabase() {

    try {

        const dbPositions =
            await this.repository.findAll();


        if (
            Array.isArray(dbPositions) &&
            dbPositions.length > 0
        ) {

            this.positions =
                dbPositions.map(position => ({

                    id: position.id,

                    positionCode:
                        position.position_code,

                    exchange:
                        position.exchange,

                    symbol:
                        position.symbol,

                    side:
                        position.side,

                    status:
                        position.status,

                    entryPrice:
                        Number(position.entry_price),


                        currentPrice:
    Number(position.entry_price),

highestPrice:
    Number(position.entry_price),

lowestPrice:
    Number(position.entry_price),

                    quantity:
                        Number(position.quantity),

                    leverage:
                        Number(position.leverage),

                    stopLoss:
                        position.stop_loss,

                    takeProfit:
                        position.take_profit,

                    timeframe:
                        position.timeframe,

                    confidence:
                        position.confidence,

                    signalId:
                        position.signal_id,

                    openedAt:
                        position.opened_at,

                    closedAt:
                        position.closed_at,

                    exitPrice:
                        position.exit_price,

                    reason:
                        position.reason,

                    pnl:{
                        value:
                            Number(position.pnl_value),

                        percent:
                            Number(position.pnl_percent)
                    }

                }));



                for (const position of this.positions) {

    if (position.status !== "OPEN") {
        continue;
    }


    const price =
        await exchangeManager.getCurrentPrice(
            position.exchange,
            position.symbol
        );


    if (price > 0) {

        position.currentPrice = price;

        position.highestPrice = price;

        position.lowestPrice = price;

        position.pnl =
            this.calculatePnL(
                position,
                price
            );

    }

}


            this.save();


            console.log(
                "📥 DATABASE POSITIONS LOADED:",
                this.positions.length
            );

        }


    }
    catch(error){

        console.error(
            "❌ DATABASE LOAD ERROR:",
            error.message
        );

    }

}



    // ==================================================
    // ENSURE STORAGE
    // ==================================================

    ensureStorage() {

        try {

            if (!fs.existsSync(STORE_DIR)) {

                fs.mkdirSync(
                    STORE_DIR,
                    {
                        recursive: true
                    }
                );

            }

            if (!fs.existsSync(STORE_FILE)) {

                fs.writeFileSync(
                    STORE_FILE,
                    "[]",
                    "utf-8"
                );

            }

        }
        catch (error) {

            console.error(
                "❌ POSITION STORAGE INIT ERROR:",
                error.message
            );

        }

    }


    // ==================================================
    // LOAD
    // ==================================================

    load() {

        try {

            if (!fs.existsSync(STORE_FILE)) {

                this.positions = [];

                return;

            }

            const data =
                fs.readFileSync(
                    STORE_FILE,
                    "utf-8"
                );

            const parsed =
                JSON.parse(data);

            this.positions =
                Array.isArray(parsed)
                    ? parsed
                    : [];

                    

                    this.positions.forEach(position => {

    if (!position.positionCode) {

        position.positionCode =
            this.generatePositionCode();

    }

});

this.save();

            console.log(
                "📂 POSITIONS LOADED:",
                this.positions.length
            );

        }
        catch (error) {

            console.error(
                "❌ POSITION LOAD ERROR:",
                error.message
            );

            this.positions = [];

        }

    }





    // ==================================================
// INIT FROM DATABASE
// ==================================================

async init() {

    try {

        const rows =
            await this.repository.getOpenPositions();


        if (!Array.isArray(rows)) {

            console.log(
                "📂 NO OPEN POSITIONS FROM DATABASE"
            );

            return;

        }


        this.positions =
            rows.map(row => ({

                id:
                    row.id,

                positionCode:
                    row.position_code,

                exchange:
                    row.exchange,

                symbol:
                    row.symbol,

                side:
                    row.side,

                status:
                    row.status,

                entryPrice:
                    Number(row.entry_price),

                quantity:
                    Number(row.quantity),

                leverage:
                    Number(row.leverage ?? 1),

                stopLoss:
                    row.stop_loss,

                takeProfit:
                    row.take_profit,

                timeframe:
                    row.timeframe,

                confidence:
                    row.confidence,

                signalId:
                    row.signal_id,

                openedAt:
                    row.opened_at,

                closedAt:
                    row.closed_at,

                exitPrice:
                    row.exit_price,

                reason:
                    row.reason,

                currentPrice:
                    Number(row.entry_price),

                highestPrice:
                    Number(row.entry_price),

                lowestPrice:
                    Number(row.entry_price),

                pnl: {

                    value:
                        Number(row.pnl_value ?? 0),

                    percent:
                        Number(row.pnl_percent ?? 0)

                }

            }));


        console.log(
            "📂 LOADED FROM POSTGRES:",
            this.positions.length,
            "OPEN POSITIONS"
        );


    }
    catch(error) {

        console.error(
            "❌ DATABASE POSITION INIT ERROR:",
            error.message
        );

    }

}







    // ==================================================
    // SAVE
    // ==================================================

    save() {

        try {

            this.ensureStorage();

            fs.writeFileSync(
                STORE_FILE,
                JSON.stringify(
                    this.positions,
                    null,
                    2
                ),
                "utf-8"
            );

        }
        catch (error) {

            console.error(
                "❌ POSITION SAVE ERROR:",
                error.message
            );

        }

    }


    // ==================================================
    // GENERATE POSITION TRACKING CODE
    // ==================================================

    generatePositionCode() {

        const now = new Date();

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

        return this.positions.some(
            position =>

                position.symbol === symbol &&

                position.status === "OPEN"

        );

    }


    // ==================================================
    // ADD POSITION
    // ==================================================

    //add(position) {




        async add(position) {





        if (!position) {

            return null;

        }

        const entryPrice =
            Number(
                position.entryPrice || 0
            );

        const quantity =
            Number(
                position.quantity || 0
            );

        // ==========================================
        // POSITION TRACKING CODE
        // ==========================================

        const positionCode =
            position.positionCode ??
            this.generatePositionCode();


        const newPosition = {

            // ------------------------------------------
            // INTERNAL ID
            // ------------------------------------------

            id:
                position.id ??
                crypto.randomUUID(),


            // ------------------------------------------
            // TRACKING CODE
            // ------------------------------------------

            positionCode,


            // ------------------------------------------
            // BASIC INFORMATION
            // ------------------------------------------

            exchange:
                position.exchange ?? null,


            symbol:
                position.symbol ?? null,


            side:
                position.side ?? null,


            action:
                position.action ?? "OPEN",


            // ------------------------------------------
            // POSITION STATUS
            // ------------------------------------------

            status:
                "OPEN",


            // ------------------------------------------
            // ENTRY
            // ------------------------------------------

            entryPrice,

            quantity,


            leverage:
                Number(
                    position.leverage ?? 1
                ),


            // ------------------------------------------
            // RISK PARAMETERS
            // ------------------------------------------

            stopLoss:
                position.stopLoss ?? null,


            takeProfit:
                position.takeProfit ?? null,


            trailing:
                position.trailing ?? null,


            // ------------------------------------------
            // ORDER INFORMATION
            // ------------------------------------------

            orderType:
                position.orderType ??
                "MARKET",


            // ------------------------------------------
            // STRATEGY INFORMATION
            // ------------------------------------------

            timeframe:
                position.timeframe ?? null,


            confidence:
                position.confidence ?? null,


            signalId:
                position.signalId ?? null,


            // ------------------------------------------
            // TIME
            // ------------------------------------------

            openedAt:
                position.openedAt ??
                new Date().toISOString(),


            closedAt:
                null,


            // ------------------------------------------
            // CURRENT MARKET STATE
            // ------------------------------------------

            currentPrice:
                entryPrice,


            highestPrice:
                entryPrice,


            lowestPrice:
                entryPrice,


            // ------------------------------------------
            // PNL
            // ------------------------------------------

            pnl: {
                value: 0,
                percent: 0
            },

// ------------------------------------------
// CLOSE INFORMATION
// ------------------------------------------

exitPrice:
    null,

reason:
    null,

fees:
    Number(
        position.fees ?? 0
    ),

riskAmount:
    Number(
        position.riskAmount ?? 0
    )

};


        this.positions.push(
    newPosition
);

this.save();

// =====================================
// SAVE TO POSTGRES
// =====================================

//this.repository.create({

//    position_code: newPosition.positionCode,

//this.repository.create({
  //  id: newPosition.id,

  //  position_code: newPosition.positionCode,

  //  exchange: newPosition.exchange,

  //  symbol: newPosition.symbol,

  //  side: newPosition.side,

  //  status: newPosition.status,

  //  entry_price: newPosition.entryPrice,

  //  quantity: newPosition.quantity,

  //  leverage: newPosition.leverage,

  //  stop_loss: newPosition.stopLoss,

  //  take_profit: newPosition.takeProfit,

  //  timeframe: newPosition.timeframe,

  //  confidence: newPosition.confidence,

  //  signal_id: newPosition.signalId,

  //  opened_at: newPosition.openedAt,

  //  closed_at: newPosition.closedAt,

  //  exit_price: newPosition.exitPrice,

  //  reason: newPosition.reason,

  //  pnl_value: newPosition.pnl.value,

  //  pnl_percent: newPosition.pnl.percent

//}).catch(console.error);




await this.repository.create({
    id: newPosition.id,

    position_code: newPosition.positionCode,

    exchange: newPosition.exchange,

    symbol: newPosition.symbol,

    side: newPosition.side,

    status: newPosition.status,

    entry_price: newPosition.entryPrice,

    quantity: newPosition.quantity,

    leverage: newPosition.leverage,

    stop_loss: newPosition.stopLoss,

    take_profit: newPosition.takeProfit,

    timeframe: newPosition.timeframe,

    confidence: newPosition.confidence,

    signal_id: newPosition.signalId,

    opened_at: newPosition.openedAt,

    closed_at: newPosition.closedAt,

    exit_price: newPosition.exitPrice,

    reason: newPosition.reason,

    pnl_value: newPosition.pnl.value,

    pnl_percent: newPosition.pnl.percent

});





console.log(
            "🔥 POSITION STORE ADD",
            {
                count:
                    this.positions.length,

                id:
                    newPosition.id,

                positionCode:
                    newPosition.positionCode,

                exchange:
                    newPosition.exchange,

                symbol:
                    newPosition.symbol,

                side:
                    newPosition.side,

                status:
                    newPosition.status
            }
        );


        return newPosition;

    }


    // ==================================================
    // UPDATE MARKET PRICE
    // ==================================================

    updatePrice(
        symbol,
        price
    )
    
    {

        const numericPrice =
            Number(price);


        if (
            !Number.isFinite(
                numericPrice
            )
        ) {

            return;

        }


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
                position.symbol !== symbol
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



                const trailingResult =
    TrailingStopEngine.calculate({

        side: position.side,

        entryPrice: position.entryPrice,

        currentPrice: numericPrice,

        highestPrice: position.highestPrice,

        lowestPrice: position.lowestPrice,

        atr: position.atr ?? null,

        settings: position.trailingSettings

    });

if (
    trailingResult?.active
) {

    position.trailing = trailingResult;

    position.stopLoss =
        trailingResult.stopPrice;

}

            changed = true;

            

        }


        if (changed) {

            this.save();

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
                position.entryPrice
            );


        const quantity =
            Number(
                position.quantity
            );


        const currentPrice =
            Number(price);


        if (
            !Number.isFinite(entryPrice) ||
            entryPrice <= 0 ||
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(currentPrice)
        ) {

            return {

                value: 0,

                percent: 0

            };

        }


        let percent = 0;


        // ------------------------------------------
        // LONG
        // ------------------------------------------

        if (
            position.side === "LONG" ||
            position.side === "BUY_OPEN"
        ) {

            percent =
                (
                    (
                        currentPrice -
                        entryPrice
                    )
                    /
                    entryPrice
                )
                *
                100;

        }


        // ------------------------------------------
        // SHORT
        // ------------------------------------------

        else if (
            position.side === "SHORT" ||
            position.side === "SELL_OPEN"
        ) {

            percent =
                (
                    (
                        entryPrice -
                        currentPrice
                    )
                    /
                    entryPrice
                )
                *
                100;

        }


        const value =
            (
                (
                    percent /
                    100
                )
                *
                entryPrice
                *
                quantity
            );


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

    update(position) {

        if (!position) {

            return null;

        }


        if (!position.id) {

            console.log(
                "❌ POSITION UPDATE WITHOUT ID"
            );

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


        this.save();


        return this.positions[index];

    }


    // ==================================================
    // CLOSE POSITION
    // ==================================================
 close(
    id,
    exitPrice,
    reason = null,
    fees = 0
) {

    const position =
        this.getById(id);


    if (!position) {

        console.log(
            "❌ POSITION NOT FOUND:",
            id
        );

        return null;

    }


    console.log(
        "🚨 POSITION CLOSE CALLED:",
        {
            id: position.id,
            symbol: position.symbol,
            status: position.status
        }
    );


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

        console.log(
            "❌ INVALID EXIT PRICE:",
            exitPrice
        );

        return null;

    }


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
        Number(fees || 0);


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



    this.save();




console.log(
    "🔴 POSITION STORE CLOSED",
        {
            id: position.id,
            symbol: position.symbol,
            reason: position.reason
        }
    );


    return position;

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

    remove(id) {

        
        this.positions =
            this.positions.filter(
                position =>
                    position.id !== id
            );


        this.save();

    }


    // ==================================================
    // GET ALL
    // ==================================================

    getAll() {

        return this.positions;

    }


    // ==================================================
    // GET OPEN POSITIONS
    // ==================================================

    getOpenPositions() {

        return this.positions.filter(
            position =>
                position.status === "OPEN"
        );

    }


    // ==================================================
    // GET CLOSED POSITIONS
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

        return this.positions.find(
            position =>

                position.symbol === symbol &&

                position.status === "OPEN"

        );

    }

}






// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new PositionStore();