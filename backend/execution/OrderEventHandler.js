
//



// ============================================================
// backend/execution/OrderEventHandler.js
// ============================================================
//
// مسیر واحد:
//
// Order Event
//      ↓
// OrderStatus
//      ↓
// OrderStore
//      ↓
// FILLED
//      ↓
// PositionCreator
//      ↓
// PositionExecutor
//
// PAPER و LIVE از همین مسیر استفاده می‌کنند.
//
// IMPORTANT:
// اگر Position ساخته نشود، باید Error به OrderExecutor
// منتقل شود تا در صورت وجود Margin رزروشده، rollback انجام شود.
//
// ============================================================

import OrderStatus from "../storage/OrderStatus.js";
import OrderStore from "../storage/OrderStore.js";
import PositionCreator from "../risk/PositionCreator.js";

class OrderEventHandler {

    // ========================================================
    // HANDLE ORDER EVENT
    // ========================================================

    async handle(event) {

        // ====================================================
        // VALIDATION
        // ====================================================

        if (!event) {
            return null;
        }


        // ====================================================
        // IGNORE HEARTBEAT
        // ====================================================

        if (event.ping) {
            return null;
        }


        // ====================================================
        // GET ORDER ID
        // ====================================================

        const orderId =
            event.orderId ||
            event.orderID ||
            event.data?.orderId ||
            event.order?.orderId;


        if (!orderId) {
            return null;
        }


        // ====================================================
        // GET STATUS
        // ====================================================

        const status =
            event.status ||
            event.orderStatus ||
            event.data?.status ||
            event.order?.status;


        if (!status) {
            return null;
        }


        // ====================================================
        // NORMALIZE STATUS
        // ====================================================

        const normalizedStatus =
            String(status)
                .trim()
                .toUpperCase();


        // ====================================================
        // UPDATE ORDER STATUS
        // ====================================================

        OrderStatus.set(
            orderId,
            normalizedStatus
        );


        // ====================================================
        // GET ORDER
        // ====================================================

        const order =
            OrderStore.getById(
                orderId
            );


        // ====================================================
        // UPDATE ORDER OBJECT
        // ====================================================

        if (order) {

            order.status =
                normalizedStatus;

        }


        // ====================================================
        // ONLY FILLED CREATES POSITION
        // ====================================================

        if (
            normalizedStatus !==
            "FILLED"
        ) {

            return {

                success: true,

                orderId,

                status:
                    normalizedStatus,

                position:
                    null

            };

        }


        // ====================================================
        // FILLED ORDER MUST EXIST
        // ====================================================

        if (!order) {

            // IMPORTANT:
            // Filled order بدون OrderStore نباید
            // به عنوان موفقیت ادامه پیدا کند.
            //
            // Error باید به OrderExecutor برسد
            // تا در صورت نیاز rollback انجام شود.

            throw new Error(
                "Filled order not found in OrderStore"
            );

        }


        // ====================================================
        // CREATE POSITION
        // ====================================================

        let position;

        try {

            position =
                await PositionCreator.create(
                    order
                );

        }
        catch (error) {

            // ==================================================
            // IMPORTANT
            // ==================================================
            //
            // خطا را swallow نمی‌کنیم.
            //
            // OrderExecutor این Error را دریافت می‌کند
            // و Margin رزروشده را rollback می‌کند.
            //
            // ==================================================

            const message =
                error?.message ||
                "Position creation failed";

            throw new Error(
                message
            );

        }


        // ====================================================
        // POSITION CREATION FAILED
        // ====================================================

        if (!position) {

            // ==================================================
            // VERY IMPORTANT
            // ==================================================
            //
            // قبلاً اینجا:
            //
            // return { success:false }
            //
            // انجام می‌شد.
            //
            // در آن حالت OrderExecutor ممکن بود تصور کند
            // Handler بدون exception تمام شده و Margin
            // رزروشده را آزاد نکند.
            //
            // اکنون Error ایجاد می‌کنیم تا OrderExecutor
            // وارد مسیر rollback شود.
            //
            // ==================================================

            throw new Error(
                "Position was not created"
            );

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        return {

            success: true,

            orderId,

            status:
                normalizedStatus,

            position

        };

    }

}


// ============================================================
// EXPORT SINGLE INSTANCE
// ============================================================

export default new OrderEventHandler();