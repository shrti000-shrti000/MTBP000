class StopLossEngine {

    static calculate({
        side,
        entryPrice,
        settings,
        atr = null
    }) {

        // Normalize legacy order-side aliases used by older positions.
        side = String(side ?? "").trim().toUpperCase();
        if (side === "BUY_OPEN") side = "LONG";
        else if (side === "SELL_OPEN") side = "SHORT";

        if (!settings || !settings.enabled) {
            return null;
        }


        const mode =
            settings.mode;

            


        const price =
            Number(entryPrice);


        if (!Number.isFinite(price)) {
            return null;
        }



        // ==========================
        // FIXED PRICE
        // ==========================

        if (mode === "FIXED" || mode === "PRICE") {

    const fixed =
        Number(settings.price);

    return Number.isFinite(fixed)
        ? fixed
        : null;
}




        // ==========================
        // PERCENT
        // ==========================

        if (mode === "PERCENT") {

            const percent =
                Number(settings.value) / 100;


            if (side === "LONG") {

                return Number(
                    (
                        price *
                        (1 - percent)
                    ).toFixed(6)
                );

            }


            return Number(
                (
                    price *
                    (1 + percent)
                ).toFixed(6)
            );

        }





        // ==========================
        // ATR
        // ==========================

        if (mode === "ATR") {


            if (
                atr == null ||
                !Number.isFinite(Number(atr))
            ) {

                return null;

            }


            const distance =
                Number(atr) *
                Number(
                    settings.atrMultiplier ?? 2
                );



            if (side === "LONG") {

                return Number(
                    (
                        price -
                        distance
                    ).toFixed(6)
                );

            }



            return Number(
                (
                    price +
                    distance
                ).toFixed(6)
            );


        }




        return null;


    }

}


export default StopLossEngine;