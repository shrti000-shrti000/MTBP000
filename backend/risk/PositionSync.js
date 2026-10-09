// backend/risk/PositionSync.js


import PositionStore from "./PositionStore.js";


class PositionSync {


    // ===============================
    // HANDLE POSITION EVENT
    // ===============================

    handle(event) {


        if (!event) {

            return;

        }



        // ===============================
        // IGNORE HEARTBEAT
        // ===============================

        if (event.ping) {

            return;

        }



       // console.log(
       //     "📍 POSITION EVENT:",
       //     event
       // );



        const position =

            event.position ||

            event.data ||

            event;



        if (!position.symbol) {

            return;

        }



        const mappedPosition = {


            symbol:

                position.symbol,



            side:

                position.positionSide ||

                position.side,



            quantity:

                Number(

                    position.quantity ||

                    position.size ||

                    0

                ),



            entryPrice:

                Number(

                    position.entryPrice ||

                    position.avgPrice ||

                    0

                ),



            exchange:

    event.exchange || null,



            status:

                "OPEN"

        };



     //   console.log(

         //   "📌 POSITION SYNC:",

          //  mappedPosition

       // );



        PositionStore.update(
    mappedPosition
);


    }


}



export default new PositionSync();