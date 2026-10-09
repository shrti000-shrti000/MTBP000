class PositionSizer {


static calculate({

    balance,

    entryPrice,

    stopLossPrice,

    riskPerTradePercent = 1,

    maxLossPerTradePercent = 2,

    leverage = 1,

    mode = "AUTO",

    fixedLot = 0.01,

    useBalancePercent = true,

    positionSizePercent = 10,

    maxPositionSize = 1000,

    minimumOrderSize = 10,

    minBalanceToTrade = 100,

}) {


    const price =
        Number(entryPrice);


    const wallet =
        Number(balance);



    if (
        !Number.isFinite(price) ||
        !Number.isFinite(wallet)
    ) {

        return 0;

    }




    // ================================
    // MIN BALANCE
    // ================================

    if (
        wallet < minBalanceToTrade
    ) {

        return 0;

    }



    let quantity = 0;




    // ================================
    // FIXED MODE
    // ================================

    if (
        mode === "FIXED"
    ) {

        quantity =
            Number(fixedLot);

    }




    // ================================
    // AUTO MODE
    // ================================

    else {



        // حجم بر اساس درصد موجودی

        if (
            useBalancePercent
        ) {


            const positionValue =

                wallet *
                (
                    Number(positionSizePercent)
                    /
                    100
                );


            quantity =

                positionValue /
                price;


        }




        // ============================
        // RISK PER TRADE
        // ============================

        if (
            stopLossPrice != null
        ) {


            const stopDistance =

                Math.abs(
                    price -
                    Number(stopLossPrice)
                );



            if (
                stopDistance > 0
            ) {


                let riskPercent =
                    Number(
                        riskPerTradePercent
                    );



                const maxLoss =
                    Number(
                        maxLossPerTradePercent
                    );



                // محدود کردن ریسک
                if (
                    riskPercent > maxLoss
                ) {

                    riskPercent =
                        maxLoss;

                }



                const riskAmount =

                    wallet *
                    (
                        riskPercent /
                        100
                    );



                const riskQuantity =

                    riskAmount /
                    stopDistance;



                quantity =

                    Math.min(
                        quantity,
                        riskQuantity
                    );


            }


        }


    }




    // ================================
    // MAX POSITION
    // ================================

    const maxQuantity =

        Number(maxPositionSize) /
        price;



    quantity =

        Math.min(
            quantity,
            maxQuantity
        );





    // ================================
    // MIN ORDER SIZE
    // ================================

    const minQuantity =

        Number(minimumOrderSize) /
        price;



    if (
        quantity < minQuantity
    ) {

        return 0;

    }





    return Number(
        (
            quantity *
            Number(leverage)
        )
        .toFixed(6)
    );


}


}


export default PositionSizer;