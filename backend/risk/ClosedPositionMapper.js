// backend/risk/ClosedPositionMapper.js

// ======================================================
// CLOSED POSITION MAPPER
//
// وظیفه:
// تبدیل PositionStore خام
// به ساختار دقیق مورد نیاز ClosedPositionsWidget
//
// نکته مهم:
// side فقط LONG / SHORT است.
// هیچ BUY / SELL در مدل Position استفاده نمی‌شود.
// ======================================================

class ClosedPositionMapper {

    // ==================================================
    // MAP ONE POSITION
    // ==================================================

    static map(position) {

        if (!position) {
            return null;
        }


        // ------------------------------------------------
        // فقط CLOSED
        // ------------------------------------------------

        if (position.status !== "CLOSED") {
            return null;
        }


        // ------------------------------------------------
        // BASIC VALUES
        // ------------------------------------------------

        const entry =
            Number(position.entryPrice) || 0;


        const exit =
            Number(position.exitPrice) || 0;


        const qty =
            Number(position.quantity) || 0;


        const leverage =
            Number(position.leverage) || 1;


        // ------------------------------------------------
        // PNL
        // ------------------------------------------------

        let pnl = 0;


        if (
            position.pnl &&
            typeof position.pnl === "object"
        ) {

            pnl =
                Number(position.pnl.value) || 0;

        }
        else if (
            position.pnl !== undefined &&
            position.pnl !== null
        ) {

            pnl =
                Number(position.pnl) || 0;

        }
        else if (
            entry > 0 &&
            exit > 0 &&
            qty > 0
        ) {

            if (position.side === "LONG") {

                pnl =
                    (exit - entry) *
                    qty;

            }
            else if (position.side === "SHORT") {

                pnl =
                    (entry - exit) *
                    qty;

            }

        }


        // ------------------------------------------------
        // PNL PERCENT
        //
        // درصد تغییر قیمت نسبت به Entry
        // برای LONG / SHORT
        // ------------------------------------------------

        let pnlPercent = 0;


        if (
            entry > 0 &&
            exit > 0
        ) {

            if (position.side === "LONG") {

                pnlPercent =
                    (
                        (exit - entry) /
                        entry
                    ) * 100;

            }
            else if (position.side === "SHORT") {

                pnlPercent =
                    (
                        (entry - exit) /
                        entry
                    ) * 100;

            }

        }


        // ------------------------------------------------
        // FEES
        //
        // فقط مقدار واقعی.
        // اگر هنوز Exchange Fee ذخیره نشده باشد:
        // null → فرانت می‌تواند — نمایش دهد.
        // ------------------------------------------------

        const fees =
            position.fees !== undefined &&
            position.fees !== null
                ? Number(position.fees)
                : null;


        // ------------------------------------------------
        // TIME
        // ------------------------------------------------

        const openDate =
            position.openedAt
                ? new Date(position.openedAt)
                : null;


        const closeDate =
            position.closedAt
                ? new Date(position.closedAt)
                : null;


        // ------------------------------------------------
        // HOLDING
        // ------------------------------------------------

        const holding =
            this.calculateHolding(
                openDate,
                closeDate
            );


        // ------------------------------------------------
        // PERIOD
        // ------------------------------------------------

        const period =
            this.calculatePeriod(
                closeDate
            );


        // ------------------------------------------------
        // REASON
        //
        // مقدار اصلی در Backend ذخیره می‌شود.
        // ------------------------------------------------

        const reason =
            this.normalizeReason(
                position.reason
            );


        // ------------------------------------------------
        // FINAL WIDGET OBJECT
        // ------------------------------------------------

        return {

            id:
                position.id,


            pair:
                position.symbol ?? null,


            exchange:
                position.exchange ?? null,


            side:
                position.side === "SHORT"
                    ? "SHORT"
                    : "LONG",


            entry,


            exit,


            qty,


            leverage,


            pnl:
                Number(
                    pnl.toFixed(2)
                ),


            pnlPercent:
                Number(
                    pnlPercent.toFixed(2)
                ),


            fees:
                fees === null
                    ? null
                    : Number(
                        fees.toFixed(2)
                    ),


            holding,


            reason,


            period,


            openTime:
                position.openedAt ?? null,


            closeTime:
                position.closedAt ?? null,

        };

    }


    // ==================================================
    // MAP MANY POSITIONS
    // ==================================================

    static mapMany(positions) {

        if (!Array.isArray(positions)) {
            return [];
        }


        return positions

            .filter(
                position =>
                    position &&
                    position.status === "CLOSED"
            )

            .map(
                position =>
                    this.map(position)
            )

            .filter(Boolean);

    }


    // ==================================================
    // HOLDING
    // ==================================================

    static calculateHolding(
        openDate,
        closeDate
    ) {

        if (
            !openDate ||
            !closeDate ||
            Number.isNaN(
                openDate.getTime()
            ) ||
            Number.isNaN(
                closeDate.getTime()
            )
        ) {

            return "—";

        }


        const milliseconds =
            Math.max(
                0,
                closeDate.getTime() -
                openDate.getTime()
            );


        const totalMinutes =
            Math.floor(
                milliseconds /
                60000
            );


        const days =
            Math.floor(
                totalMinutes /
                1440
            );


        const hours =
            Math.floor(
                (
                    totalMinutes %
                    1440
                ) /
                60
            );


        const minutes =
            totalMinutes %
            60;


        if (days > 0) {

            return `${days}d ${hours}h`;

        }


        if (hours > 0) {

            return `${hours}h ${minutes}m`;

        }


        return `${minutes}m`;

    }


    // ==================================================
    // PERIOD
    // ==================================================

    static calculatePeriod(
        closeDate
    ) {

        if (
            !closeDate ||
            Number.isNaN(
                closeDate.getTime()
            )
        ) {

            return "Unknown";

        }


        const now =
            new Date();


        const today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        const closedDay =
            new Date(
                closeDate.getFullYear(),
                closeDate.getMonth(),
                closeDate.getDate()
            );


        const difference =
            Math.floor(
                (
                    today.getTime() -
                    closedDay.getTime()
                ) /
                86400000
            );


        if (difference === 0) {

            return "Today";

        }


        if (difference === 1) {

            return "Yesterday";

        }


        if (difference >= 0) {

            const day =
                today.getDay();


            const daysSinceMonday =
                day === 0
                    ? 6
                    : day - 1;


            const startOfWeek =
                new Date(
                    today
                );


            startOfWeek.setDate(
                today.getDate() -
                daysSinceMonday
            );


            if (
                closedDay >=
                new Date(
                    startOfWeek.getFullYear(),
                    startOfWeek.getMonth(),
                    startOfWeek.getDate()
                )
            ) {

                return "This Week";

            }

        }


        if (
            closeDate.getFullYear() ===
                now.getFullYear() &&
            closeDate.getMonth() ===
                now.getMonth()
        ) {

            return "This Month";

        }


        return "Older";

    }


    // ==================================================
    // REASON
    // ==================================================

    static normalizeReason(
        reason
    ) {

        if (!reason) {
            return "Unknown";
        }


        const value =
            String(reason)
                .trim()
                .toUpperCase();


        switch (value) {

            case "TAKE_PROFIT":
            case "TAKE PROFIT":
            case "TP":

                return "Take Profit";


            case "STOP_LOSS":
            case "STOP LOSS":
            case "SL":

                return "Stop Loss";


            case "TRAILING_STOP":
            case "TRAILING STOP":
            case "TRAILING":

                return "Trailing Stop";


            case "MANUAL_CLOSE":
            case "MANUAL CLOSE":
            case "MANUAL":

                return "Manual Close";


            default:

                return String(reason);

        }

    }

}


// ======================================================
// EXPORT
// ======================================================

export default ClosedPositionMapper;