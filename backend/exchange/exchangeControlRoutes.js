// ======================================================
// MTBP
// Exchange Control Routes
//
// API عمومی کنترل مستقل صرافی‌ها
//
// مثال:
//
// POST /api/exchanges/TOOBIT/start
// POST /api/exchanges/TOOBIT/stop
// POST /api/exchanges/TOOBIT/pause
// POST /api/exchanges/TOOBIT/freeze
//
// برای صرافی آینده:
//
// POST /api/exchanges/WEEX/start
// POST /api/exchanges/BINANCE/pause
//
// هیچ نام صرافی به صورت Hard-Code نشده است.
// ======================================================

import express from "express";

import ExchangeControlService
    from "./ExchangeControlService.js";


const router =
    express.Router();


// ======================================================
// GET ALL EXCHANGE STATES
//
// Dashboard می‌تواند وضعیت تمام صرافی‌ها را بگیرد.
//
// GET /api/exchanges
// ======================================================

router.get(
    "/",
    (req, res) => {

        try {

            const states =
                ExchangeControlService.getAllStates();


            return res.json({

                success: true,

                exchanges:
                    states

            });

        } catch (error) {

            console.error(
                "EXCHANGE STATES ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "EXCHANGE_STATES_ERROR"

            });

        }

    }
);


// ======================================================
// GET SINGLE EXCHANGE STATE
//
// GET /api/exchanges/:exchange
//
// مثال:
//
// GET /api/exchanges/TOOBIT
// ======================================================

router.get(
    "/:exchange",
    (req, res) => {

        try {

            const exchange =
                req.params.exchange;


            const state =
                ExchangeControlService.getState(
                    exchange
                );


            if (!state) {

                return res.status(404).json({

                    success: false,

                    error:
                        "EXCHANGE_NOT_FOUND"

                });

            }


            return res.json({

                success: true,

                exchange:
                    state.exchange,

                state:
                    state

            });

        } catch (error) {

            console.error(
                "EXCHANGE STATE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "EXCHANGE_STATE_ERROR"

            });

        }

    }
);


// ======================================================
// GENERIC ACTION
//
// POST /api/exchanges/:exchange/:action
//
// action:
//
// start
// stop
// pause
// freeze
//
// این Route عمداً Generic است.
// ======================================================

router.post(
    "/:exchange/:action",
    (req, res) => {

        try {

            const exchange =
                req.params.exchange;


            const action =
                req.params.action;


            const result =
                ExchangeControlService.execute(
                    exchange,
                    action
                );


            if (!result?.success) {

                return res.status(400).json(
                    result
                );

            }


            return res.json(
                result
            );

        } catch (error) {

            console.error(
                "EXCHANGE CONTROL ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "EXCHANGE_CONTROL_ERROR",

                message:
                    error.message

            });

        }

    }
);


// ======================================================
// EXPORT
// ======================================================

export default router;