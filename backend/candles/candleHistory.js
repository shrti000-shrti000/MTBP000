export class CandleHistory {

    constructor(
        baseUrl = "https://api.toobit.com"
    ) {

        this.baseUrl =
            baseUrl.replace(/\/+$/, "");

        this.timeframes = {

            "1m": 60 * 1000,

            "5m": 5 * 60 * 1000,

            "15m": 15 * 60 * 1000,

            "30m": 30 * 60 * 1000,

            "1h": 60 * 60 * 1000,

            "4h": 4 * 60 * 60 * 1000,

        };

    }


    // =========================================
    // SYMBOL CONVERSION
    // =========================================

    convertSymbol(symbol) {

        if (!symbol) {

            return symbol;

        }

        // مهم:
        // Symbol را تغییر نمی‌دهیم.
        // مثلاً:
        // BTCUSDT -> BTCUSDT
        // HOTUSDT -> HOTUSDT

        return symbol;

    }


    // =========================================
    // GET HISTORICAL OHLCV
    // =========================================

    async getOHLCV(

        symbol,

        interval = "1m",

        limit = 200

    ) {

        try {

            if (
                !this.timeframes[interval]
            ) {

                throw new Error(
                    `Unsupported timeframe: ${interval}`
                );

            }


            const intervalMs =
                this.timeframes[interval];


            const apiSymbol =
                this.convertSymbol(symbol);


            const url =
                `${this.baseUrl}/quote/v1/klines` +
                `?symbol=${encodeURIComponent(apiSymbol)}` +
                `&interval=${encodeURIComponent(interval)}` +
                `&limit=${Number(limit)}`;


            const res =
                await fetch(url);


            // =========================================
            // INVALID SYMBOL
            // =========================================

            if (!res.ok) {

                let errorBody = "";

                try {

                    errorBody =
                        await res.text();

                }
                catch {

                    errorBody = "";

                }


                // اگر Symbol در Toobit معتبر نباشد
                // دیگر آن را Exception سنگین نمی‌کنیم.

                if (
                    res.status === 400 &&
                    errorBody.includes(
                        "Invalid Symbols"
                    )
                ) {

                    return [];

                }


                throw new Error(

                    `HTTP ${res.status}` +
                    (
                        errorBody
                            ? ` - ${errorBody}`
                            : ""
                    )

                );

            }


            const raw =
                await res.json();


            if (
                !Array.isArray(raw)
            ) {

                return [];

            }


            const now =
                Date.now();


            const candles =

                raw

                .map(
                    (candle) => {

                        const openTime =
                            Number(
                                candle[0]
                            );


                        return {

                            symbol,

                            interval,

                            openTime,

                            open:
                                Number(
                                    candle[1]
                                ),

                            high:
                                Number(
                                    candle[2]
                                ),

                            low:
                                Number(
                                    candle[3]
                                ),

                            close:
                                Number(
                                    candle[4]
                                ),

                            volume:
                                Number(
                                    candle[5]
                                ),

                            closeTime:
                                openTime +
                                intervalMs -
                                1,

                        };

                    }
                )

                .filter(
                    (candle) => {

                        return (

                            candle.openTime +
                            intervalMs <=
                            now

                        );

                    }
                )

                .sort(
                    (a, b) =>
                        a.openTime -
                        b.openTime
                );


            return candles;

        }

        catch (error) {

            console.error(

                "CANDLE HISTORY ERROR:",

                {

                    symbol,

                    interval,

                    limit,

                    error:
                        error.message

                }

            );

            return [];

        }

    }


    // =========================================
    // GET MULTIPLE SYMBOLS
    // =========================================

    async getBatch(

        symbols,

        interval = "1m",

        limit = 200

    ) {

        const result = {};


        if (
            !Array.isArray(symbols)
        ) {

            return result;

        }


        for (
            const symbol
            of symbols
        ) {

            result[symbol] =
                await this.getOHLCV(

                    symbol,

                    interval,

                    limit

                );

        }


        return result;

    }


    // =========================================
    // GET ALL TIMEFRAMES FOR ONE SYMBOL
    // =========================================

    async getAllTimeframes(

        symbol,

        limit = 200

    ) {

        const result = {};


        for (
            const timeframe
            of Object.keys(
                this.timeframes
            )
        ) {

            result[timeframe] =
                await this.getOHLCV(

                    symbol,

                    timeframe,

                    limit

                );

        }


        return result;

    }


    // =========================================
    // GET ALL SYMBOLS + ALL TIMEFRAMES
    // =========================================

    async getAll(

        symbols,

        limit = 200

    ) {

        const result = {};


        if (
            !Array.isArray(symbols)
        ) {

            return result;

        }


        for (
            const symbol
            of symbols
        ) {

            result[symbol] =
                await this.getAllTimeframes(

                    symbol,

                    limit

                );

        }


        return result;

    }

}