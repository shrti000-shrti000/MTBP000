// ======================================================
// MTBP
// Exchange Control Service
//
// کنترل مستقل هر صرافی:
//
// START
// STOP
// PAUSE
// FREEZE
//
// این Service عمداً به هیچ صرافی خاصی وابسته نیست.
//
// صرافی از طریق exchangeId مشخص می‌شود:
//
// TOOBIT
// WEEX
// BINANCE
// KUCOIN
// ...
//
// تعداد و نام صرافی‌های آینده برای این فایل مهم نیست.
// ======================================================

import ExchangeStateManager from "./ExchangeStateManager.js";


class ExchangeControlService {


    // ==================================================
    // NORMALIZE EXCHANGE
    // ==================================================

    normalizeExchange(exchange) {

        if (
            exchange === null ||
            exchange === undefined
        ) {

            return null;

        }


        return String(exchange)
            .trim()
            .toUpperCase();

    }


    // ==================================================
    // GET STATE
    // ==================================================

    getState(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return null;

        }


        return ExchangeStateManager.getState(
            exchangeId
        );

    }


    // ==================================================
    // START
    //
    // START فقط وضعیت همان صرافی را تغییر می‌دهد.
    //
    // صرافی‌های دیگر هیچ تغییری نمی‌کنند.
    // ==================================================

    start(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                success: false,

                error:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        const state =
            ExchangeStateManager.getState(
                exchangeId
            );


        if (!state) {

            return {

                success: false,

                error:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        // ================================================
        // START فقط وقتی منطقی است که اتصال وجود داشته باشد
        // ================================================

        if (!state.connected) {

            return {

                success: false,

                error:
                    "EXCHANGE_DISCONNECTED",

                exchange:
                    exchangeId,

                state

            };

        }


        if (!state.apiConnected) {

            return {

                success: false,

                error:
                    "API_NOT_CONNECTED",

                exchange:
                    exchangeId,

                state

            };

        }


        // ================================================
        // فعال کردن صرافی
        // ================================================

        ExchangeStateManager.enable(
            exchangeId
        );


        // ================================================
        // حذف Emergency Stop قبلی
        // ================================================

        ExchangeStateManager.setEmergencyStop(
            exchangeId,
            false
        );


        // ================================================
        // فعال کردن Auto Trading
        // ================================================

        ExchangeStateManager.setAutoTrading(
            exchangeId,
            true
        );


        // ================================================
        // RUNNING
        // ================================================

        const updatedState =
            ExchangeStateManager.setStatus(
                exchangeId,
                "RUNNING"
            );


        return {

            success: true,

            action:
                "START",

            exchange:
                exchangeId,

            state:
                updatedState

        };

    }


    // ==================================================
    // STOP
    //
    // توقف کامل Auto Trading برای همان صرافی.
    // ==================================================

    stop(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                success: false,

                error:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        const state =
            ExchangeStateManager.getState(
                exchangeId
            );


        if (!state) {

            return {

                success: false,

                error:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        // ================================================
        // Auto Trading خاموش
        // ================================================

        ExchangeStateManager.setAutoTrading(
            exchangeId,
            false
        );


        // ================================================
        // Emergency Stop خاموش
        // ================================================

        ExchangeStateManager.setEmergencyStop(
            exchangeId,
            false
        );


        // ================================================
        // وضعیت STOPPED
        // ================================================

        const updatedState =
            ExchangeStateManager.setStatus(
                exchangeId,
                "STOPPED"
            );


        return {

            success: true,

            action:
                "STOP",

            exchange:
                exchangeId,

            state:
                updatedState

        };

    }


    // ==================================================
    // PAUSE
    //
    // توقف موقت.
    //
    // وضعیت اتصال صرافی حفظ می‌شود.
    // ==================================================

    pause(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                success: false,

                error:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        const state =
            ExchangeStateManager.getState(
                exchangeId
            );


        if (!state) {

            return {

                success: false,

                error:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        // ================================================
        // Auto Trading موقتاً متوقف می‌شود
        // ================================================

        ExchangeStateManager.setAutoTrading(
            exchangeId,
            false
        );


        // ================================================
        // Emergency Stop فعال نمی‌شود.
        //
        // چون PAUSE با FREEZE متفاوت است.
        // ================================================

        ExchangeStateManager.setEmergencyStop(
            exchangeId,
            false
        );


        // ================================================
        // PAUSED
        // ================================================

        const updatedState =
            ExchangeStateManager.setStatus(
                exchangeId,
                "PAUSED"
            );


        return {

            success: true,

            action:
                "PAUSE",

            exchange:
                exchangeId,

            state:
                updatedState

        };

    }


    // ==================================================
    // FREEZE
    //
    // توقف حفاظتی صرافی.
    //
    // Emergency Stop فعال می‌شود.
    // ==================================================

    freeze(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                success: false,

                error:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        const state =
            ExchangeStateManager.getState(
                exchangeId
            );


        if (!state) {

            return {

                success: false,

                error:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        // ================================================
        // Auto Trading خاموش
        // ================================================

        ExchangeStateManager.setAutoTrading(
            exchangeId,
            false
        );


        // ================================================
        // Emergency Stop فعال
        // ================================================

        ExchangeStateManager.setEmergencyStop(
            exchangeId,
            true
        );


        // ================================================
        // FROZEN
        // ================================================

        const updatedState =
            ExchangeStateManager.setStatus(
                exchangeId,
                "FROZEN"
            );


        return {

            success: true,

            action:
                "FREEZE",

            exchange:
                exchangeId,

            state:
                updatedState

        };

    }


    // ==================================================
    // EXECUTE ACTION
    //
    // یک ورودی عمومی برای API آینده.
    //
    // مثال:
    //
    // execute("TOOBIT", "START")
    // execute("WEEX", "PAUSE")
    // execute("BINANCE", "FREEZE")
    // ==================================================

    execute(
        exchange,
        action
    ) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                success: false,

                error:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        const normalizedAction =
            String(action)
                .trim()
                .toUpperCase();


        switch (
            normalizedAction
        ) {

            case "START":

                return this.start(
                    exchangeId
                );


            case "STOP":

                return this.stop(
                    exchangeId
                );


            case "PAUSE":

                return this.pause(
                    exchangeId
                );


            case "FREEZE":

                return this.freeze(
                    exchangeId
                );


            default:

                return {

                    success: false,

                    error:
                        "INVALID_ACTION",

                    action:
                        normalizedAction,

                    allowedActions: [

                        "START",

                        "STOP",

                        "PAUSE",

                        "FREEZE"

                    ]

                };

        }

    }


    // ==================================================
    // CAN TRADE
    //
    // آیا همین صرافی اجازه معامله دارد؟
    // ==================================================

    canTrade(exchange) {

        const exchangeId =
            this.normalizeExchange(
                exchange
            );


        if (!exchangeId) {

            return {

                allowed: false,

                reason:
                    "EXCHANGE_ID_REQUIRED"

            };

        }


        return ExchangeStateManager.canTrade(
            exchangeId
        );

    }


    // ==================================================
    // GET ALL EXCHANGES
    //
    // برای Dashboard و تب‌های آینده.
    // ==================================================

    getAllStates() {

        return ExchangeStateManager.getAll();

    }

}


// ======================================================
// SINGLETON
// ======================================================

export default new ExchangeControlService();