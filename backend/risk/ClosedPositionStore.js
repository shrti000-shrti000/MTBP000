class ClosedPositionStore {

    constructor() {

        this.positions = [];

    }

    add(position) {

        this.positions.unshift({

            ...position,

            closedAt:

                Date.now(),

        });

    }

    getAll() {

        return this.positions;

    }

    getWins() {

        return this.positions.filter(

            position =>

                position.pnl?.value > 0

        );

    }

    getLosses() {

        return this.positions.filter(

            position =>

                position.pnl?.value <= 0

        );

    }

    clear() {

        this.positions = [];

    }

}

export default new ClosedPositionStore();