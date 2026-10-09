

// کد کاملا اصلاحی



// ======================================================
// MTBP
// Exchange State Manager
//
// مدیریت وضعیت مستقل هر صرافی
//
// سه Timer مستقل:
// 1. Session Time
// 2. Last Update
// 3. Last Change
//
// هر Reset کاملاً مستقل است.
//
// AUTO TRADING:
//
// RUNNING  -> قابل فعال‌سازی
// STOPPED  -> همیشه OFF
// PAUSED   -> همیشه OFF
// FROZEN   -> همیشه OFF
//
// برگشت از PAUSED / FROZEN به RUNNING
// باعث فعال شدن خودکار Auto Trading نمی‌شود.
// ======================================================


class ExchangeStateManager {


    constructor() {

        this.exchanges =
            new Map();

    }


    // ==================================================
    // REGISTER EXCHANGE
    // ==================================================

    register(exchange) {

        const key =
            this.normalize(exchange);


        if (!key) {

            return false;

        }


        if (
            this.exchanges.has(key)
        ) {

            return true;

        }


        const now =
            Date.now();


        this.exchanges.set(

            key,

            {

                // ======================================
                // IDENTIFICATION
                // ======================================

                exchange:
                    key,


                // ======================================
                // MARKET CONNECTION
                // ======================================

                connected:
                    false,


                // ======================================
                // REST API CONNECTION
                // ======================================

                apiConnected:
                    false,


                // ======================================
                // USER STREAM CONNECTION
                // ======================================

                userStream:
                    false,


                // ======================================
                // RUNTIME STATUS
                // ======================================

                status:
                    "STOPPED",


                enabled:
                    false,


                // ======================================
                // AUTO TRADING
                //
                // هنگام Boot همیشه OFF
                // ======================================

                autoTrading:
                    false,


                emergencyStop:
                    false,


                // ======================================
                // TRADE DIRECTION
                // ======================================

                allowLong:
                    true,

                allowShort:
                    true,


                // ======================================
                // TIME
                // ======================================

                startedAt:
                    null,


                lastStateChange:
                    now,


                updatedAt:
                    new Date(now)
                        .toISOString(),


                // ======================================
                // TIMER RESET BASE
                //
                // سه Timer کاملاً مستقل
                // ======================================

                sessionResetAt:
                    now,


                lastUpdateResetAt:
                    now,


                lastChangeResetAt:
                    now

            }

        );


        return true;

    }


    // ==================================================
    // NORMALIZE EXCHANGE
    // ==================================================

    normalize(exchange) {

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
    // ENSURE EXCHANGE
    // ==================================================

    ensure(exchange) {

        const key =
            this.normalize(exchange);


        if (!key) {

            return null;

        }


        if (
            !this.exchanges.has(key)
        ) {

            this.register(key);

        }


        return key;

    }


    // ==================================================
    // GET STATE
    // ==================================================

    getState(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        return {

            ...state

        };

    }


    // ==================================================
    // GET ALL
    // ==================================================

    getAll() {

        return Array.from(
            this.exchanges.values()
        ).map(

            state => ({

                ...state

            })

        );

    }


    // ==================================================
    // SET MARKET CONNECTION
    // ==================================================

    setConnected(
        exchange,
        connected
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.connected =
            Boolean(connected);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // GET MARKET CONNECTION
    // ==================================================

    isConnected(exchange) {

        const state =
            this.getState(exchange);


        return Boolean(
            state?.connected
        );

    }


    // ==================================================
    // SET REST API CONNECTION
    // ==================================================

    setApiConnected(
        exchange,
        connected
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.apiConnected =
            Boolean(connected);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // GET REST API CONNECTION
    // ==================================================

    isApiConnected(exchange) {

        const state =
            this.getState(exchange);


        return Boolean(
            state?.apiConnected
        );

    }


    // ==================================================
    // SET USER STREAM CONNECTION
    // ==================================================

    setUserStreamConnected(
        exchange,
        connected
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.userStream =
            Boolean(connected);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // GET USER STREAM CONNECTION
    // ==================================================

    isUserStreamConnected(exchange) {

        const state =
            this.getState(exchange);


        return Boolean(
            state?.userStream
        );

    }


    // ==================================================
    // SET STATUS
    //
    // قوانین مهم:
    //
    // RUNNING:
    // Auto Trading دست‌نخورده باقی می‌ماند.
    //
    // STOPPED:
    // Auto Trading = OFF
    //
    // PAUSED:
    // Auto Trading = OFF
    //
    // FROZEN:
    // Auto Trading = OFF
    //
    // برگشت به RUNNING:
    // Auto Trading خودکار ON نمی‌شود.
    // ==================================================

    setStatus(
        exchange,
        status
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const normalizedStatus =
            String(status)
                .trim()
                .toUpperCase();


        const allowedStatuses = [

            "RUNNING",

            "STOPPED",

            "PAUSED",

            "FROZEN"

        ];


        if (
            !allowedStatuses.includes(
                normalizedStatus
            )
        ) {

            throw new Error(

                `Invalid exchange status: ${status}`

            );

        }


        const state =
            this.exchanges.get(key);


        const now =
            Date.now();


        // ============================================
        // STATE CHANGE
        // ============================================

        if (
            state.status !==
            normalizedStatus
        ) {

            state.status =
                normalizedStatus;


            state.lastStateChange =
                now;

        }


        // ============================================
        // RUNNING
        //
        // Auto Trading را تغییر نمی‌دهیم.
        //
        // اگر قبلاً OFF بوده OFF می‌ماند.
        // اگر قبلاً ON بوده فقط در صورتی ON می‌ماند
        // که مستقیماً از وضعیت دیگری به RUNNING
        // نرفته باشیم.
        //
        // اما چون PAUSED/FROZEN/STOPPED پایین‌تر
        // Auto Trading را خاموش می‌کنند،
        // برگشت به RUNNING باعث ON شدن خودکار نمی‌شود.
        // ============================================

        if (
            normalizedStatus ===
            "RUNNING"
        ) {

            if (
                !state.startedAt
            ) {

                state.startedAt =
                    now;

            }

        }


        // ============================================
        // STOPPED
        //
        // توقف کامل Exchange
        // Auto Trading باید خاموش باشد.
        // ============================================

        if (
            normalizedStatus ===
            "STOPPED"
        ) {

            state.startedAt =
                null;


            state.autoTrading =
                false;

        }


        // ============================================
        // PAUSED
        //
        // در حالت Pause هیچ Auto Trading فعالی
        // نباید باقی بماند.
        // ============================================

        if (
            normalizedStatus ===
            "PAUSED"
        ) {

            state.autoTrading =
                false;

        }


        // ============================================
        // FROZEN
        //
        // در حالت Freeze هیچ Auto Trading فعالی
        // نباید باقی بماند.
        // ============================================

        if (
            normalizedStatus ===
            "FROZEN"
        ) {

            state.autoTrading =
                false;

        }


        // ============================================
        // UPDATE TIME
        // ============================================

        state.updatedAt =
            new Date(now)
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // GET STATUS
    // ==================================================

    getStatus(exchange) {

        const state =
            this.getState(exchange);


        return (
            state?.status ??
            "STOPPED"
        );

    }


    // ==================================================
    // ENABLE EXCHANGE
    // ==================================================

    enable(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.enabled =
            true;


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // DISABLE EXCHANGE
    //
    // Disable همیشه:
    //
    // status = STOPPED
    // Auto Trading = OFF
    // ==================================================

    disable(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.enabled =
            false;


        state.status =
            "STOPPED";


        state.startedAt =
            null;


        state.lastStateChange =
            Date.now();


        // ============================================
        // SAFETY
        // ============================================

        state.autoTrading =
            false;


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // AUTO TRADING
    //
    // فقط در RUNNING اجازه تغییر دارد.
    //
    // STOPPED / PAUSED / FROZEN
    // همیشه OFF هستند.
    // ==================================================

    setAutoTrading(
        exchange,
        value
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        // ============================================
        // EXCHANGE MUST BE RUNNING
        // ============================================

        if (
            state.status !==
            "RUNNING"
        ) {

            state.autoTrading =
                false;


            state.updatedAt =
                new Date()
                    .toISOString();


            return this.getState(key);

        }


        // ============================================
        // RUNNING
        // ============================================

        state.autoTrading =
            Boolean(value);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // EMERGENCY STOP
    // ==================================================

    setEmergencyStop(
        exchange,
        value
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.emergencyStop =
            Boolean(value);


        // ============================================
        // EMERGENCY STOP
        //
        // اگر فعال شد Auto Trading خاموش شود.
        // ============================================

        if (
            state.emergencyStop
        ) {

            state.autoTrading =
                false;

        }


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // ALLOW LONG
    // ==================================================

    setAllowLong(
        exchange,
        value
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.allowLong =
            Boolean(value);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // ALLOW SHORT
    // ==================================================

    setAllowShort(
        exchange,
        value
    ) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        state.allowShort =
            Boolean(value);


        state.updatedAt =
            new Date()
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // RESET SESSION TIMER
    //
    // فقط SESSION TIME
    //
    // LAST UPDATE تغییر نمی‌کند
    // LAST CHANGE تغییر نمی‌کند
    // ==================================================

    resetSessionTime(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        const now =
            Date.now();


        // ============================================
        // RESET BASE
        // ============================================

        state.sessionResetAt =
            now;


        // ============================================
        // SESSION TIMER
        //
        // تایمر Session از startedAt
        // استفاده می‌کند.
        // ============================================

        if (
            state.status ===
            "RUNNING"
        ) {

            state.startedAt =
                now;

        }
        else {

            state.startedAt =
                null;

        }


        return this.getState(key);

    }


    // ==================================================
    // RESET LAST UPDATE TIMER
    //
    // فقط LAST UPDATE
    //
    // SESSION تغییر نمی‌کند
    // LAST CHANGE تغییر نمی‌کند
    // ==================================================

    resetLastUpdate(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        const now =
            Date.now();


        // ============================================
        // RESET BASE
        // ============================================

        state.lastUpdateResetAt =
            now;


        // ============================================
        // LAST UPDATE TIMER
        //
        // تایمر Last Update از updatedAt
        // استفاده می‌کند.
        // ============================================

        state.updatedAt =
            new Date(now)
                .toISOString();


        return this.getState(key);

    }


    // ==================================================
    // RESET LAST CHANGE TIMER
    //
    // فقط LAST CHANGE
    //
    // SESSION تغییر نمی‌کند
    // LAST UPDATE تغییر نمی‌کند
    // ==================================================

    resetLastChange(exchange) {

        const key =
            this.ensure(exchange);


        if (!key) {

            return null;

        }


        const state =
            this.exchanges.get(key);


        const now =
            Date.now();


        // ============================================
        // RESET BASE
        // ============================================

        state.lastChangeResetAt =
            now;


        // ============================================
        // LAST CHANGE TIMER
        //
        // تایمر Last Change از
        // lastStateChange استفاده می‌کند.
        // ============================================

        state.lastStateChange =
            now;


        return this.getState(key);

    }


    // ==================================================
    // CAN TRADE
    // ==================================================

    canTrade(exchange) {

        const state =
            this.getState(exchange);


        if (!state) {

            return {

                allowed:
                    false,

                reason:
                    "EXCHANGE_NOT_FOUND"

            };

        }


        if (!state.enabled) {

            return {

                allowed:
                    false,

                reason:
                    "EXCHANGE_DISABLED"

            };

        }


        if (!state.connected) {

            return {

                allowed:
                    false,

                reason:
                    "EXCHANGE_DISCONNECTED"

            };

        }


        if (!state.apiConnected) {

            return {

                allowed:
                    false,

                reason:
                    "API_NOT_CONNECTED"

            };

        }


        if (
            state.status !==
            "RUNNING"
        ) {

            return {

                allowed:
                    false,

                reason:
                    `EXCHANGE_${state.status}`

            };

        }


        if (
            state.emergencyStop
        ) {

            return {

                allowed:
                    false,

                reason:
                    "EMERGENCY_STOP"

            };

        }


        if (
            !state.autoTrading
        ) {

            return {

                allowed:
                    false,

                reason:
                    "AUTO_TRADING_DISABLED"

            };

        }


        return {

            allowed:
                true,

            reason:
                null

        };

    }

}


// ======================================================
// SINGLETON
// ======================================================

export default new ExchangeStateManager();