

//



/**
 * ============================================================
 * MTBP - ATR Indicator
 *
 * Average True Range (Wilder)
 *
 * Streaming Indicator
 * ============================================================
 */

import { BaseIndicator } from "../core/BaseIndicator.js";


export default class ATR extends BaseIndicator {


    constructor(options = {}) {

        super({

            name: "ATR",

            period:
                options.period || 14

        });


        this.previousClose = null;

        this.trueRanges = [];

        this.atr = null;

        this.initialized = false;

    }



    /**
     * Update ATR using one CLOSED candle.
     */
    update(candle) {

       if (candle.symbol === "BTCUSDT") {

    
    

}



        if (!candle) return;


        if (this.isDuplicateCandle(candle)) {
            return;
        }


        const high =
            Number(candle.high);


        const low =
            Number(candle.low);


        const close =
            Number(candle.close);



        if (
            !Number.isFinite(high) ||
            !Number.isFinite(low) ||
            !Number.isFinite(close)
        ) {

            return;

        }



        const candleTime =
            this.getCandleTime(candle);



        // اولین کندل

        if (this.previousClose === null) {

            this.previousClose = close;

            return;

        }



        // =========================
        // TRUE RANGE
        // =========================


        const tr = Math.max(

            high - low,


            Math.abs(
                high - this.previousClose
            ),


            Math.abs(
                low - this.previousClose
            )

        );



        this.trueRanges.push(tr);





        this.previousClose = close;



        // =========================
        // INITIAL ATR (SMA)
        // =========================


        if (!this.initialized) {


            if (
                this.trueRanges.length <
                this.period
            ) {

                return;

            }



            let sum = 0;


            for (
                let i = 0;
                i < this.period;
                i++
            ) {

                sum += this.trueRanges[i];

            }



            this.atr =
                sum / this.period;



            this.initialized = true;


        }



        else {



            // =========================
            // WILDER SMOOTHING
            // =========================


            const lastTR =
                this.trueRanges[
                    this.trueRanges.length - 1
                ];



            this.atr =
                (

                    (
                        this.atr *
                        (this.period - 1)
                    )

                    +

                    lastTR

                )

                /

                this.period;


        }



        // ======================================================
        // حفظ مقدار واقعی ATR بدون گرد کردن اجباری
        //
        // قبلاً toFixed(6) می‌توانست ATRهای بسیار کوچک را
        // به 0 تبدیل کند.
        // ======================================================

        const value =
            Number(this.atr);


        this.atr = value;


        this.setValue(
            value,
            candleTime
        );


        return this.atr;





    }





    /**
     * Latest ATR value
     */
    getATR() {

        return this.atr;

    }





    reset() {


        super.reset();


        this.previousClose = null;

        this.trueRanges = [];

        this.atr = null;

        this.initialized = false;


    }


}
