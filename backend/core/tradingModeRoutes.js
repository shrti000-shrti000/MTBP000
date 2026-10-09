// ======================================================
// MTBP
// Trading Mode Routes
// ======================================================
//
// PAPER / LIVE
//
// این Route فقط مسئول Trading Mode است.
//
// Trading Mode:
// - PAPER
// - LIVE
//
// تغییر Mode:
// - Bot را Start نمی‌کند.
// - Bot را Stop نمی‌کند.
// - Exchange را Start نمی‌کند.
// - Exchange را Stop نمی‌کند.
// - Auto Trading را تغییر نمی‌دهد.
//
// فقط Mode سیستم را تغییر می‌دهد.
//
// ======================================================

import express from "express";

import LiveTradingManager from "../config/LiveTradingManager.js";


// ======================================================
// ROUTER
// ======================================================

const router =
    express.Router();


// ======================================================
// GET TRADING MODE
// ======================================================
//
// Frontend:
// GET /api/trading-mode
//
// Response:
//
// {
//     success: true,
//     mode: "PAPER"
// }
//
// ======================================================

router.get(
    "/",
    (req, res) => {

        try {

            return res.json({

                success: true,

                mode:
                    LiveTradingManager
                        .getTradingMode()

            });

        }
        catch (error) {

            console.error(
                "❌ TRADING MODE GET ERROR:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ======================================================
// SET TRADING MODE
// ======================================================
//
// Frontend:
//
// POST /api/trading-mode
//
// Body:
//
// {
//     "mode": "LIVE"
// }
//
// یا:
//
// {
//     "mode": "PAPER"
// }
//
// ======================================================

router.post(
    "/",
    (req, res) => {

        try {

            const mode =
                req.body?.mode;


            const result =
                LiveTradingManager
                    .setTradingMode(
                        mode
                    );


            if (!result.success) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        mode:
                            result.mode,

                        error:
                            result.error

                    });

            }


            return res.json({

                success: true,

                mode:
                    result.mode

            });

        }
        catch (error) {

            console.error(
                "❌ TRADING MODE SET ERROR:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        error.message

                });

        }

    }
);


// ======================================================
// EXPORT
// ======================================================

export default router;