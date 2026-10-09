class OrderStatus {

    constructor() {

        this.orders = new Map();

    }

    set(orderId, status) {

        this.orders.set(orderId, status);

    }

    get(orderId) {

        return this.orders.get(orderId);

    }

    has(orderId) {

        return this.orders.has(orderId);

    }

    remove(orderId) {

        this.orders.delete(orderId);

    }

    getAll() {

        return Array.from(this.orders.entries());

    }

}

export default new OrderStatus();