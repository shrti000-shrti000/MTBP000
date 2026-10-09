// backend/execution/OrderResponseMapper.js

class OrderResponseMapper {

    // ===============================
    // MAP EXCHANGE RESPONSE
    // ===============================

    static map({

        exchange,

        order,

        response,

    }) {


        if (!response) {

            return {

                success: false,

                exchange,

                error:
                    "Empty exchange response"

            };

        }



        // ===============================
        // EXCHANGE ERROR HANDLING
        // ===============================

        const exchangeError =
    response.code ??
    response.order?.code;



if (
    exchangeError &&
    exchangeError !== 0
) {

            return {

                success: false,

                exchange,

                orderId: null,

                symbol:
                    order.symbol,

                side:
                    order.side,

                type:
                    order.type,

                quantity:
                    order.quantity,

                status:
                    "REJECTED",

                error:
    response.msg ??
    response.order?.msg ??
    "Exchange rejected order",


exchangeCode:
    exchangeError,

                createdAt:
                    Date.now(),

                raw:
                    response

            };

        }



        // ===============================
        // SUCCESS RESPONSE
        // ===============================

        const exchangeFailed =
    (response.code && response.code !== 0) ||
    (response.order?.code && response.order.code !== 0);


return {


    success:

        !exchangeFailed,


            exchange,



            orderId:

                response.orderId ??

                response.id ??

                null,



            symbol:

                order.symbol,



            side:

                order.side,



            type:

                order.type,



            quantity:

                order.quantity,



            price:

                response.price ??

                order.price ??

                null,



            status:

                response.status ??

                "NEW",



            createdAt:

                Date.now(),

            error:

    exchangeFailed
        ? response.msg
        : null,


exchangeCode:

    exchangeFailed
        ? response.code
        : null,

            raw:

                response


        };


    }

}


export default OrderResponseMapper;