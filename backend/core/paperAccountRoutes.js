import express from "express";

import PaperTradingManager from "../config/PaperTradingManager.js";

const router = express.Router();


// ========================================
// PAPER ACCOUNT
// GET ACCOUNT STATE
// ========================================

router.get(
    "/",
    async (req, res) => {

        try {

            await PaperTradingManager.waitUntilReady();

            return res.json({

                success: true,

                account:
                    PaperTradingManager.getState()

            });

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT API ERROR:",
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


// ========================================
// RESET PAPER ACCOUNT
// ========================================

router.post(
    "/reset",
    async (req, res) => {

        try {

            await PaperTradingManager.waitUntilReady();

            const balance =
                req.body?.balance ?? 1000;

            const success =
                await PaperTradingManager.reset(
                    balance
                );

            if (!success) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Paper account reset failed"

                    });

            }

            return res.json({

                success: true,

                account:
                    PaperTradingManager.getState()

            });

        }
        catch (error) {

            console.error(
                "❌ PAPER ACCOUNT RESET ERROR:",
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


export default router;