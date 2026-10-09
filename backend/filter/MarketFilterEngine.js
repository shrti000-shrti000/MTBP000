import ActiveSymbolsStore from "./ActiveSymbolsStore.js";

export class MarketFilterEngine {

    static initialize() {

       const symbols = [

    // Major

    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "TRXUSDT",
    "AVAXUSDT",
    "LINKUSDT",

    // Layer 1

    "DOTUSDT",
    "ATOMUSDT",
    "NEARUSDT",
    "APTUSDT",
    "SUIUSDT",
    "SEIUSDT",
    "TIAUSDT",
    "TONUSDT",
    "ICPUSDT",
    "HBARUSDT",

    // Infrastructure

    "FILUSDT",
    "ARUSDT",
    "STXUSDT",
    "TAOUSDT",
    "RENDERUSDT",
    "FETUSDT",
    "INJUSDT",
    "OPUSDT",
    "ARBUSDT",
    "MNTUSDT",

    // DeFi

    "AAVEUSDT",
    "UNIUSDT",
    "CRVUSDT",
    "MKRUSDT",
    "COMPUSDT",
    "LDOUSDT",
    "SNXUSDT",
    "DYDXUSDT",
    "1INCHUSDT",
    "PENDLEUSDT",

    // Memes

    "PEPEUSDT",
    "SHIBUSDT",
    "FLOKIUSDT",
    "BONKUSDT",
    "WIFUSDT",
    "DOGSUSDT",
    "TURBOUSDT",
    "NEIROUSDT",
    "BRETTUSDT",
    "POPCATUSDT",

    // Gaming & Metaverse

    "SANDUSDT",
    "MANAUSDT",
    "AXSUSDT",
    "GALAUSDT",
    "IMXUSDT",
    "CHZUSDT",
    "ENJUSDT",
    "BEAMUSDT",
    "RONUSDT",
    "NOTUSDT",

    // AI

    "PYTHUSDT",
    "AKTUSDT",
    "OCEANUSDT",
    "AGIXUSDT",
    "NMRUSDT",
    "IOUSDT",
    "ZKUSDT",
    "ENAUSDT",
    "JUPUSDT",
    "ALTUSDT",

    // Utility

    "ALGOUSDT",
    "VETUSDT",
    "THETAUSDT",
    "XTZUSDT",
    "FLOWUSDT",
    "EGLDUSDT",
    "CFXUSDT",
    "MINAUSDT",
    "ROSEUSDT",
    "KAVAUSDT",

    // Exchange & Finance

    "OKBUSDT",
    "GTUSDT",
    "KCSUSDT",
    "XLMUSDT",
    "EOSUSDT",
    "ZECUSDT",
    "DASHUSDT",
    "QTUMUSDT",
    "ONTUSDT",
    "KSMUSDT",

    // Extra Liquidity

    "JASMYUSDT",
    "CKBUSDT",
    "ANKRUSDT",
    "BATUSDT",
    "HOTUSDT",
    "WAVESUSDT",
    "SKLUSDT",
    "API3USDT",
    "BALUSDT",
    "SUSHIUSDT"

];

        ActiveSymbolsStore.setSymbols(symbols);

       // console.log(
        //    "🟢 FILTER READY:",
        //    symbols.length
        //);

        return symbols;

    }

}