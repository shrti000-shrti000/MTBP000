// ==========================================================
// MTBP - BOT CONTROLLER
// ==========================================================
//
// کنترل وضعیت کلی Runtime ربات
//
// وضعیت‌های کلی:
//
// RUNNING
// STOPPED
// PAUSED
// FROZEN
//
// ==========================================================
//
// قانون اصلی سیستم:
//
// BOT RUNNING
//      ↓
// Exchange Control فعال و مستقل
//
// BOT STOPPED
//      ↓
// تمام Exchange ها STOPPED
// تمام کنترل‌های Exchange غیرفعال
//
// BOT PAUSED
//      ↓
// تمام Exchange ها PAUSED
// تمام کنترل‌های Exchange غیرفعال
//
// BOT FROZEN
//      ↓
// تمام Exchange ها FROZEN
// تمام کنترل‌های Exchange غیرفعال
//
// فقط BOT START
//      ↓
// Exchange Control دوباره فعال می‌شود.
//
// ==========================================================


import ExchangeStateManager
    from "../exchange/ExchangeStateManager.js";



class BotController {


    // ======================================================
    // CONSTRUCTOR
    // ======================================================

    constructor() {

        this.status =
            "STOPPED";


        this.lastStateChange =
            Date.now();


        this.startedAt =
            null;

    }



    // ======================================================
    // START
    //
    // شروع کلی Bot
    //
    // نکته:
    //
    // START فقط وضعیت Bot را RUNNING می‌کند.
    //
    // Exchange هایی که قبلاً PAUSED/FROZEN/STOPPED بوده‌اند
    // خودکار RUNNING نمی‌شوند.
    //
    // کاربر باید بعد از START دوباره Exchange را کنترل کند.
    //
    // ======================================================

    start() {

        const now =
            Date.now();


        this.status =
            "RUNNING";


        this.lastStateChange =
            now;


        if (!this.startedAt) {

            this.startedAt =
                now;

        }


        return this.getStatus();

    }



    // ======================================================
    // STOP
    //
    // Bot = STOPPED
    //
    // تمام Exchange ها = STOPPED
    //
    // ======================================================

    stop() {

        const now =
            Date.now();


        // --------------------------------------------------
        // BOT STOPPED
        // --------------------------------------------------

        this.status =
            "STOPPED";


        this.lastStateChange =
            now;


        this.startedAt =
            null;


        // --------------------------------------------------
        // تمام Exchange ها STOPPED
        // --------------------------------------------------

        this.syncAllExchanges(
            "STOPPED"
        );


        return this.getStatus();

    }



    // ======================================================
    // PAUSE
    //
    // Bot = PAUSED
    //
    // تمام Exchange ها = PAUSED
    //
    // ======================================================

    pause() {

        const now =
            Date.now();


        // --------------------------------------------------
        // BOT PAUSED
        // --------------------------------------------------

        this.status =
            "PAUSED";


        this.lastStateChange =
            now;


        // --------------------------------------------------
        // تمام Exchange ها PAUSED
        // --------------------------------------------------

        this.syncAllExchanges(
            "PAUSED"
        );


        return this.getStatus();

    }



    // ======================================================
    // FREEZE
    //
    // Bot = FROZEN
    //
    // تمام Exchange ها = FROZEN
    //
    // ======================================================

    freeze() {

        const now =
            Date.now();


        // --------------------------------------------------
        // BOT FROZEN
        // --------------------------------------------------

        this.status =
            "FROZEN";


        this.lastStateChange =
            now;


        // --------------------------------------------------
        // تمام Exchange ها FROZEN
        // --------------------------------------------------

        this.syncAllExchanges(
            "FROZEN"
        );


        return this.getStatus();

    }



    // ======================================================
    // RESET
    //
    // Bot = STOPPED
    // Exchange = STOPPED
    //
    // ======================================================

    reset() {

        const now =
            Date.now();


        this.status =
            "STOPPED";


        this.startedAt =
            null;


        this.lastStateChange =
            now;


        this.syncAllExchanges(
            "STOPPED"
        );


        return this.getStatus();

    }



    // ======================================================
    // SYNC ALL EXCHANGES
    //
    // وضعیت Bot را روی تمام Exchange ها اعمال می‌کند.
    //
    // ======================================================

    syncAllExchanges(status) {

        const exchanges =
            ExchangeStateManager.getAll();


        for (
            const exchangeState
            of exchanges
        ) {

            ExchangeStateManager.setStatus(

                exchangeState.exchange,

                status

            );

        }

    }



    // ======================================================
    // IS RUNNING
    // ======================================================

    isRunning() {

        return (
            this.status ===
            "RUNNING"
        );

    }



    // ======================================================
    // IS EXCHANGE CONTROL ENABLED
    //
    // فقط وقتی Bot RUNNING باشد
    // Exchange Control فعال است.
    //
    // این تابع را Frontend هم می‌تواند از API استفاده کند.
    //
    // ======================================================

    isExchangeControlEnabled() {

        return (
            this.status ===
            "RUNNING"
        );

    }



    // ======================================================
    // GET STATUS
    // ======================================================

    getStatus() {

        return {

            status:
                this.status,

            startedAt:
                this.startedAt,

            lastStateChange:
                this.lastStateChange,

            running:
                this.isRunning(),

            exchangeControlEnabled:
                this.isExchangeControlEnabled()

        };

    }



    // ======================================================
    // START EXCHANGE
    //
    // قانون بسیار مهم:
    //
    // اگر Bot RUNNING نیست:
    //
    // ❌ اجازه START نداریم
    //
    // و وضعیت Exchange را تغییر نمی‌دهیم.
    //
    // یعنی:
    //
    // BOT PAUSED
    // EXCHANGE PAUSED
    //
    // با START Exchange:
    //
    // همچنان PAUSED می‌ماند.
    //
    // ======================================================

    startExchange(exchange) {

        // --------------------------------------------------
        // BOT باید RUNNING باشد
        // --------------------------------------------------

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setStatus(

            exchange,

            "RUNNING"

        );

    }



    // ======================================================
    // STOP EXCHANGE
    //
    // اگر Bot RUNNING نباشد:
    //
    // هیچ تغییری ایجاد نمی‌شود.
    //
    // ======================================================

    stopExchange(exchange) {

        // --------------------------------------------------
        // Exchange Control فقط وقتی فعال است که Bot RUNNING
        // باشد.
        // --------------------------------------------------

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setStatus(

            exchange,

            "STOPPED"

        );

    }



    // ======================================================
    // PAUSE EXCHANGE
    //
    // فقط وقتی Bot RUNNING باشد قابل اجراست.
    //
    // ======================================================

    pauseExchange(exchange) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setStatus(

            exchange,

            "PAUSED"

        );

    }



    // ======================================================
    // FREEZE EXCHANGE
    //
    // فقط وقتی Bot RUNNING باشد قابل اجراست.
    //
    // ======================================================

    freezeExchange(exchange) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setStatus(

            exchange,

            "FROZEN"

        );

    }



    // ======================================================
    // GET EXCHANGE STATUS
    // ======================================================

    getExchangeStatus(exchange) {

        return ExchangeStateManager.getState(

            exchange

        );

    }



    // ======================================================
    // GET ALL EXCHANGE STATUSES
    // ======================================================

    getAllExchangeStatuses() {

        return ExchangeStateManager.getAll();

    }



    // ======================================================
    // CONNECTED
    // ======================================================

    setExchangeConnected(
        exchange,
        connected
    ) {

        return ExchangeStateManager.setConnected(

            exchange,

            connected

        );

    }



    // ======================================================
    // API CONNECTION
    // ======================================================

    setExchangeApiConnected(
        exchange,
        connected
    ) {

        return ExchangeStateManager.setApiConnected(

            exchange,

            connected

        );

    }



    // ======================================================
    // ENABLE EXCHANGE
    //
    // این تنظیم نیز فقط زمانی قابل تغییر است که
    // Bot RUNNING باشد.
    // ======================================================

    enableExchange(exchange) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.enable(

            exchange

        );

    }



    // ======================================================
    // DISABLE EXCHANGE
    // ======================================================

    disableExchange(exchange) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.disable(

            exchange

        );

    }



    // ======================================================
    // AUTO TRADING
    // ======================================================

    setExchangeAutoTrading(
        exchange,
        value
    ) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setAutoTrading(

            exchange,

            value

        );

    }



    // ======================================================
    // EMERGENCY STOP
    //
    // Emergency Stop استثناست.
    //
    // چون یک مکانیزم ایمنی است،
    // حتی وقتی Bot متوقف است می‌توان آن را فعال کرد.
    //
    // ======================================================

    setExchangeEmergencyStop(
        exchange,
        value
    ) {

        return ExchangeStateManager.setEmergencyStop(

            exchange,

            value

        );

    }



    // ======================================================
    // ALLOW LONG
    // ======================================================

    setExchangeAllowLong(
        exchange,
        value
    ) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setAllowLong(

            exchange,

            value

        );

    }



    // ======================================================
    // ALLOW SHORT
    // ======================================================

    setExchangeAllowShort(
        exchange,
        value
    ) {

        if (
            this.status !==
            "RUNNING"
        ) {

            return ExchangeStateManager.getState(
                exchange
            );

        }


        return ExchangeStateManager.setAllowShort(

            exchange,

            value

        );

    }



    // ======================================================
    // CAN EXCHANGE TRADE
    // ======================================================

    canExchangeTrade(exchange) {

        // --------------------------------------------------
        // BOT باید RUNNING باشد
        // --------------------------------------------------

        if (
            this.status !==
            "RUNNING"
        ) {

            return {

                allowed:
                    false,

                reason:
                    `BOT_${this.status}`

            };

        }


        return ExchangeStateManager.canTrade(

            exchange

        );

    }

}



// ==========================================================
// SINGLETON
// ==========================================================

export default new BotController();