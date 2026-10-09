class PositionHistory {

    constructor() {

        this.closed = [];

    }

    add(position) {

        this.closed.unshift({

            ...position,

            closedAt: Date.now()

        });

    }

    getAll() {

        return this.closed;

    }

    clear() {

        this.closed = [];

    }

}

export default new PositionHistory();