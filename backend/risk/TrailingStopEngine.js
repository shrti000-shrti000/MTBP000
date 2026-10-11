class TrailingStopEngine {

    static calculate({

        side,

        entryPrice,

        currentPrice,

        highestPrice,

        lowestPrice,

        atr,

        settings,

    }) 
    
    
    {

       // console.log(settings);

        const result = {

            active: false,

            stopPrice: null,

        };


        // ==========================
        // DISABLED
        // ==========================

        if (!settings?.enabled) {

            return result;

        }



        // ==========================
        // PRICE MODE
        // ==========================

        if (
            settings.mode === "PRICE"
        ) {


            const activationPrice =
                Number(
                    settings.activationPrice
                );


           // const distance =
               /// Number(
                  //  settings.distance
               // );


           // const step =
               // Number(
                   // settings.step
               // );

                 const distancePercent =
    Number(settings.distance) / 100;

const step =
    Number(settings.step);



            // LONG

            if (
                side === "LONG"
            ) {


                if (
                    highestPrice >= activationPrice
                ) {


                    result.active = true;


                    const moved =
                        highestPrice -
                        activationPrice;



                    const steps =
                        step > 0
                        ?
                        Math.floor(
                            moved / step
                        )
                        :
                        0;



                    const lockPrice =
                        activationPrice +
                        (
                            steps *
                            step
                        );



                    //result.stopPrice =
                       // Number(
                           // (
                            //    lockPrice -
                            //    distance
                            //)
                           // .toFixed(6)
                      //  );


                      result.stopPrice =
    Number(
        (
            lockPrice *
            (1 - distancePercent)
        )
        .toFixed(6)
    );


                }


            }



            // SHORT

            if (
                side === "SHORT"
            ) {


                if (
                    lowestPrice < activationPrice
                ) {


                    result.active = true;


                    const moved =
                        activationPrice -
                        lowestPrice;



                    const steps =
                        step > 0
                        ?
                        Math.floor(
                            moved / step
                        )
                        :
                        0;



                    //const lockPrice =
                       // activationPrice -
                       // (
                       //     steps *
                       //     step
                       // );

                     //  const lockPrice =
    //step > 0
        //?
        ///activationPrice -
        //(
          //  steps *
          //  step
        //)
        //:
        //lowestPrice;



                    //result.stopPrice =
                       // Number(
                         //   (
                             //   lockPrice +
                             //   distance
                           // )
                          //  .toFixed(6)
                       // );



                      // result.stopPrice =
    //Number(
       // (
          //  lockPrice *
          //  (1 + distancePercent)
        //)
        //.toFixed(6)
    //);



    const lockPrice =
    step > 0
        ?
        activationPrice -
        (
            steps *
            step
        )
        :
        lowestPrice;


//let stopPrice =
   // lockPrice *
    //(
    //    1 +
    //    distance / 100
    
    // );



    ///let stopPrice =
   /// lockPrice *
   /// (
    ///    1 +
    ///    Number(settings.distance) / 100
    ///);


// ==========================
// SHORT PROFIT LOCK
// ==========================

///if (
 ///   stopPrice > entryPrice
///) {

  ///  stopPrice = entryPrice;

///}


///result.stopPrice =
 ///   Number(
 ///       stopPrice.toFixed(6)
 ///   );


 // ==========================
// SHORT PROFIT LOCK
// ==========================

let stopPrice =
    lockPrice *
    (
        1 +
        Number(settings.distance) / 100
    );


// استاپ شورت نباید از ورود بالاتر باشد
// مگر اینکه هنوز سود قفل نشده باشد

if (
    stopPrice > entryPrice
) {

    stopPrice = entryPrice;

}


// جلوگیری از استاپ بالاتر از قیمت فعلی
//if (
  //  stopPrice > currentPrice
//) {

 //   stopPrice = currentPrice;

//}


result.stopPrice =
    Number(
        stopPrice.toFixed(6)
    );




                }

            }



            return result;

        }





        // ==========================
        // PERCENT MODE
        // ==========================

        if (
            settings.mode === "PERCENT"
        ) {


            const activationPercent =
                Number(
                    settings.activationPercent
                ) / 100;


            const distance =
                Number(
                    settings.distance
                ) / 100;


            const step =
                Number(
                    settings.step
                ) / 100;




            // LONG

            if (
                side === "LONG"
            ) {


                const activationPrice =
                    entryPrice *
                    (
                        1 +
                        activationPercent
                    );

             //   console.log(
  //  "LONG PRICE MODE",
  // {
      //  entryPrice,
      //  highestPrice,
      //  activationPrice
   // }
//);





                if (
                    highestPrice >= activationPrice
                ) {


                    result.active = true;



                    const moved =
                        (
                            highestPrice -
                            activationPrice
                        )
                        /
                        entryPrice;



                    const steps =
                        step > 0
                        ?
                        Math.floor(
                            moved / step
                        )
                        :
                        0;



                    const lockPrice =
                        activationPrice +
                        (
                            steps *
                            step *
                            entryPrice
                        );



                    result.stopPrice =
                        Number(
                            (
                                lockPrice *
                                (
                                    1 -
                                    distance
                                )
                            )
                            .toFixed(6)
                        );


                }


            }




            // SHORT

            if (
                side === "SHORT"
            ) {


                const activationPrice =
                    entryPrice *
                    (
                        1 -
                        activationPercent
                    );



                //if (
                 //   lowestPrice <= activationPrice
                //) {



                if (
    lowestPrice < activationPrice
) {


                    result.active = true;



                    const moved =
                        (
                            activationPrice -
                            lowestPrice
                        )
                        /
                        entryPrice;



                    const steps =
                        step > 0
                        ?
                        Math.floor(
                            moved / step
                        )
                        :
                        0;



                    const lockPrice =
                        activationPrice -
                        (
                            steps *
                            step *
                            entryPrice
                        );



                    result.stopPrice =
                        Number(
                            (
                                lockPrice *
                                (
                                    1 +
                                    distance
                                )
                            )
                            .toFixed(6)
                        );


                }


            }


            return result;

        }


// ==========================
// ATR MODE
// ==========================

if (
    settings.mode === "ATR"
) {

    if (
        !atr ||
        atr <= 0
    ) {

        return result;

    }

        const multiplier =
        Number(
            settings.atrMultiplier ?? 2
        );


    const atrDistance =
        Number(atr) *
        multiplier;



    // ==========================
    // LONG
    // ==========================

    if (
        side === "LONG"
    ) {

        result.active = true;

        result.stopPrice =
            Number(
                (
                    highestPrice -
                    atrDistance
                )
                .toFixed(6)
            );

    }



    // ==========================
    // SHORT
    // ==========================

    if (
        side === "SHORT"
    ) {

        result.active = true;

        result.stopPrice =
            Number(
                (
                    lowestPrice +
                    atrDistance
                )
                .toFixed(6)
            );

    }


    return result;

}

// ==========================
// CHANDELIER MODE
// ==========================

if (
    settings.mode === "CHANDELIER"
) {

    if (
        !Number.isFinite(Number(atr)) ||
        Number(atr) <= 0 ||
        !Number.isFinite(Number(entryPrice)) ||
        Number(entryPrice) <= 0
    ) {
        return result;
    }

    const numericAtr = Number(atr);

    const multiplier =
        Number(settings.atrMultiplier ?? 3);

    // Do not let Chandelier act as an initial stop from the entry tick.
    // It becomes active only after a favourable move of at least 1 ATR by
    // default. This avoids an immediate, ultra-tight trail (e.g. 0.5 ATR)
    // being treated as an entry stop. The initial Stop Loss remains primary.
    const activationAtrMultiplier = Math.max(
        0,
        Number(settings.activationAtrMultiplier ?? 1)
    );

    const activationDistance =
        numericAtr * activationAtrMultiplier;

    if (
        side === "LONG" &&
        Number(highestPrice) >=
            Number(entryPrice) + activationDistance
    ) {
        const stopPrice =
            Number(highestPrice) -
            numericAtr * multiplier;

        if (
            Number.isFinite(stopPrice) &&
            stopPrice > 0
        ) {
            result.active = true;
            result.stopPrice = Number(stopPrice.toFixed(8));
        }
    }

    if (
        side === "SHORT" &&
        Number(lowestPrice) <=
            Number(entryPrice) - activationDistance
    ) {
        const stopPrice =
            Number(lowestPrice) +
            numericAtr * multiplier;

        if (
            Number.isFinite(stopPrice) &&
            stopPrice > 0
        ) {
            result.active = true;
            result.stopPrice = Number(stopPrice.toFixed(8));
        }
    }

    return result;
}



// ==========================
// VOLATILITY MODE
// ==========================

if (
    settings.mode === "VOLATILITY" ||
    settings.mode === "VOLATILITY_STOP"
)


{


    if (
        !atr ||
        atr <= 0
    ) {

        return result;

    }



    //const activation =
     //   Number(
      //      settings.activationPercent ?? 2
      //  ) / 100;



      const activation = 0;



    const multiplier =
        Number(
            settings.atrMultiplier ?? 3
        );



    // ==========================
    // LONG
    // ==========================

    if (
        side === "LONG"
    ) {


        const activationPrice =
            entryPrice *
            (
                1 +
                activation
            );


        if (
            highestPrice >= activationPrice
        ) {


            result.active = true;


            result.stopPrice =
                Number(
                    (
                        currentPrice -
                        (
                            atr *
                            multiplier
                        )
                    )
                    .toFixed(6)
                );

        }

    }




    // ==========================
    // SHORT
    // ==========================

    if (
        side === "SHORT"
    ) {


        const activationPrice =
            entryPrice *
            (
                1 -
                activation
            );


        if (
            lowestPrice <= activationPrice
        ) {


            result.active = true;


            result.stopPrice =
                Number(
                    (
                        currentPrice +
                        (
                            atr *
                            multiplier
                        )
                    )
                    .toFixed(6)
                );

        }

    }


    return result;

}





// ==========================
// TEMP FALLBACK
// ==========================

return result;

    }


    

}


export default TrailingStopEngine;