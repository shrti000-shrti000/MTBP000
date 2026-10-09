// backend/storage/OrderStore.js


class OrderStore {


    constructor() {

        this.orders = [];

    }



    // ===============================
    // ADD ORDER
    // ===============================

    add(order) {

        this.orders.push(order);

    }



    // ===============================
    // GET ALL
    // ===============================

    getAll() {

        return this.orders;

    }



    // ===============================
    // GET BY ID
    // ===============================

    getById(orderId) {

        return this.orders.find(

            order =>

                order.orderId === orderId

        );

    }



    // ===============================
    // CLEAR
    // ===============================

    clear() {

        this.orders = [];

    }


}


export default new OrderStore();