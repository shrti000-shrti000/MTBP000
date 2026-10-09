


// کد کاملا اصلاحی



// ======================================================
// MTBP
// LiveTradingManager
// ======================================================

import ExchangeStateManager from "../exchange/ExchangeStateManager.js";


class LiveTradingManager {

    constructor() {

        this.state = {

            // ==================================================
            // LIVE TRADING
            // ==================================================
            //
            // هنگام Boot خاموش است.
            //
            enabled: false,


            // ==================================================
            // AUTO TRADING
            // ==================================================

            autoTrading: false,


            // ==================================================
            // TRADING MODE
            //
            // PAPER = true
            // LIVE  = false
            //
            // سیستم همیشه با PAPER شروع می‌شود.
            // ==================================================

            paperMode: true,


            // ==================================================
            // EMERGENCY STOP
            // ==================================================

            emergencyStop: false,


            // ==================================================
            // LONG / SHORT
            // ==================================================

            allowLong: true,

            allowShort: true,


            // ==================================================
            // GLOBAL EXCHANGE STATUS
            // ==================================================

            exchangeConnected: false,

            apiConnected: false,


            // ==================================================
            // BOT STATUS
            // ==================================================

            status: "STOPPED"

        };

    }



    // ==================================================
    // GET STATE
    // ==================================================

    getState() {

        return {

            ...this.state

        };

    }



    // ==================================================
    // ENABLE / DISABLE LIVE TRADING
    // ==================================================

    enable() {

        this.state.enabled = true;

    }


    disable() {

        this.state.enabled = false;

    }


    isEnabled() {

        return this.state.enabled;

    }



    // ==================================================
    // AUTO TRADING
    // ==================================================

    setAutoTrading(value) {

        this.state.autoTrading =
            Boolean(value);

    }


    isAutoTradingEnabled() {

        return this.state.autoTrading;

    }



    // ==================================================
    // TRADING MODE
    //
    // PAPER / LIVE
    //
    // PAPER:
    // سفارش‌ها شبیه‌سازی می‌شوند.
    //
    // LIVE:
    // سفارش واقعی می‌تواند به Exchange ارسال شود.
    //
    // توجه:
    // تغییر Mode به تنهایی:
    //
    // - Bot را START نمی‌کند.
    // - Auto Trading را فعال نمی‌کند.
    // - Exchange را فعال نمی‌کند.
    // - هیچ سفارشی ارسال نمی‌کند.
    //
    // بنابراین Mode فقط Mode سیستم را تعیین می‌کند.
    // ==================================================

    setTradingMode(mode) {

        const normalizedMode =
            String(mode ?? "")
                .trim()
                .toUpperCase();


        // ==================================================
        // PAPER
        // ==================================================

        if (
            normalizedMode ===
            "PAPER"
        ) {

            this.state.paperMode = true;

            return {

                success: true,

                mode: "PAPER"

            };

        }


        // ==================================================
        // LIVE
        // ==================================================

        if (
            normalizedMode ===
            "LIVE"
        ) {

            this.state.paperMode = false;

            return {

                success: true,

                mode: "LIVE"

            };

        }


        // ==================================================
        // INVALID MODE
        // ==================================================

        return {

            success: false,

            mode:
                this.getTradingMode(),

            error:
                "INVALID_TRADING_MODE"

        };

    }



    // ==================================================
    // GET TRADING MODE
    //
    // خروجی همیشه:
    //
    // PAPER
    // یا
    // LIVE
    // ==================================================

    getTradingMode() {

        return this.state.paperMode
            ? "PAPER"
            : "LIVE";

    }



    // ==================================================
    // PAPER MODE
    // ==================================================

    setPaperMode(value) {

        this.state.paperMode =
            Boolean(value);

    }


    isPaperMode() {

        return this.state.paperMode;

    }



    // ==================================================
    // LIVE MODE
    // ==================================================

    isLiveMode() {

        return !this.state.paperMode;

    }



    // ==================================================
    // EMERGENCY STOP
    // ==================================================

    setEmergencyStop(value) {

        this.state.emergencyStop =
            Boolean(value);

    }


    isEmergencyStop() {

        return this.state.emergencyStop;

    }



    // ==================================================
    // LONG / SHORT
    // ==================================================

    allowLong(value) {

        this.state.allowLong =
            Boolean(value);

    }


    allowShort(value) {

        this.state.allowShort =
            Boolean(value);

    }


    isLongAllowed() {

        return this.state.allowLong;

    }


    isShortAllowed() {

        return this.state.allowShort;

    }



    // ==================================================
    // EXCHANGE
    // ==================================================

    setExchangeConnected(value) {

        this.state.exchangeConnected =
            Boolean(value);

    }


    isExchangeConnected() {

        return this.state.exchangeConnected;

    }



    // ==================================================
    // API
    // ==================================================

    setApiConnected(value) {

        this.state.apiConnected =
            Boolean(value);

    }


    isApiConnected() {

        return this.state.apiConnected;

    }



    // ==================================================
    // STATUS
    // ==================================================

    setStatus(status) {

        this.state.status =
            status;

    }


    getStatus() {

        return this.state.status;

    }



    // ==================================================
    // CAN EXECUTE TRADE
    //
    // کنترل عمومی سیستم + کنترل اختصاصی صرافی
    //
    // مثال:
    //
    // canExecuteTrade("TOOBIT")
    // canExecuteTrade("BINANCE")
    // canExecuteTrade("KUCOIN")
    //
    // هر صرافی وضعیت مستقل خودش را دارد.
    //
    // نکته:
    // این تابع مربوط به اجازه اجرای LIVE است.
    //
    // PAPER از این مسیر برای ارسال سفارش واقعی
    // استفاده نمی‌کند.
    // ==================================================

    canExecuteTrade(exchange = null) {

        // ==================================================
        // EXCHANGE REQUIRED
        // ==================================================

        if (!exchange) {

            return {

                allowed: false,

                reason:
                    "EXCHANGE_REQUIRED"

            };

        }


        // ==================================================
        // GLOBAL LIVE TRADING
        // ==================================================

        if (!this.state.enabled) {

            return {

                allowed: false,

                reason:
                    "LIVE_MODE_DISABLED"

            };

        }


        // ==================================================
        // GLOBAL EMERGENCY STOP
        // ==================================================

        if (
            this.state.emergencyStop
        ) {

            return {

                allowed: false,

                reason:
                    "EMERGENCY_STOP"

            };

        }


        // ==================================================
        // GET EXCHANGE STATE
        // ==================================================

        const exchangeState =
            ExchangeStateManager.getState(
                exchange
            );


        // ==================================================
        // EXCHANGE NOT REGISTERED
        // ==================================================

        if (!exchangeState) {

            return {

                allowed: false,

                reason:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        // ==================================================
        // EXCHANGE CONNECTION
        // ==================================================

        if (
            !exchangeState.connected
        ) {

            return {

                allowed: false,

                reason:
                    "EXCHANGE_DISCONNECTED"

            };

        }


        // ==================================================
        // API CONNECTION
        // ==================================================

        if (
            !exchangeState.apiConnected
        ) {

            return {

                allowed: false,

                reason:
                    "API_NOT_CONNECTED"

            };

        }


        // ==================================================
        // EXCHANGE ENABLED
        // ==================================================

        if (
            !exchangeState.enabled
        ) {

            return {

                allowed: false,

                reason:
                    "EXCHANGE_DISABLED"

            };

        }


        // ==================================================
        // EXCHANGE STATUS
        //
        // فقط RUNNING اجازه معامله جدید دارد.
        //
        // STOPPED
        // PAUSED
        // FROZEN
        //
        // اجازه ورود معامله جدید ندارند.
        // ==================================================

        if (
            exchangeState.status !==
            "RUNNING"
        ) {

            return {

                allowed: false,

                reason:
                    `EXCHANGE_${exchangeState.status}`

            };

        }


        // ==================================================
        // AUTO TRADING
        // ==================================================

        if (
            !exchangeState.autoTrading
        ) {

            return {

                allowed: false,

                reason:
                    "AUTO_TRADING_DISABLED"

            };

        }


        // ==================================================
        // TRADE ALLOWED
        // ==================================================

        return {

            allowed: true,

            reason: null,

            exchange:
                exchangeState.exchange,

            status:
                exchangeState.status

        };

    }

}



// ======================================================
// SINGLE INSTANCE
// ======================================================

export default new LiveTradingManager();

