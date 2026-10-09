// backend/position/PositionManager.js

import PositionStore from "../risk/PositionStore.js";

class PositionManager {

    // ===============================
    // CREATE POSITION
    // ===============================

    create(order) {


        

        const position = {

            id:

                order.orderId ?? Date.now(),

            exchange:

                order.exchange,

            symbol:

                order.symbol,

            side:

                order.side,

            quantity:

                order.quantity,

            entryPrice:

                order.price ?? 0,

            currentPrice:

                order.price ?? 0,

            pnl:

                0,

            status:

                "OPEN",

            openedAt:

                Date.now()

        };


        PositionStore.add(position);


        

        return position;

    }



    // ===============================
    // GET ALL
    // ===============================

    getAll() {

        return PositionStore.getAll();

    }



    // ===============================
    // GET ONE
    // ===============================

    get(symbol) {

        return PositionStore.getBySymbol(symbol);

    }



    // ===============================
    // CLOSE
    // ===============================

    close(symbol) {

        PositionStore.remove(symbol);

    }

}

export default new PositionManager();