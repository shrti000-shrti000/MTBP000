import PositionStore from "../risk/PositionStore.js";
import PositionCloser from "./PositionCloser.js";

class PositionManager {

    getAll() {

        return PositionStore.getAll();

    }

    getOpen() {

        return PositionStore.getOpen();

    }

    getById(id) {

        return PositionStore.get(id);

    }

    getBySymbol(symbol) {

        return PositionStore
            .getOpen()
            .filter(p => p.symbol === symbol);

    }

    async close(positionId, reason = "MANUAL") {

        const position =
            PositionStore.get(positionId);

        if (!position) {

            return {

                success: false,

                error: "Position not found"

            };

        }

        return await PositionCloser.close({

            ...position,

            closeReason: reason

        });

    }

    async closeAll(reason = "MANUAL") {

        const positions =
            PositionStore.getOpen();

        const results = [];

        for (const position of positions) {

            results.push(

                await this.close(

                    position.id,

                    reason

                )

            );

        }

        return results;

    }

}

export default new PositionManager();