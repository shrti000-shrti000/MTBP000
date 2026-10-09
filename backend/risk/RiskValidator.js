import riskSettings from "../config/riskSettings.js";
import RiskStore from "./RiskStore.js";
import AccountStore from "../account/AccountStore.js";
import PositionStore from "./PositionStore.js";


class RiskValidator {


static validate(
    balance = null,
    side = null,
    riskAmount = 0
) {


    const currentBalance =
        balance ?? AccountStore.getBalance();



    //const openPositions =
     //   PositionStore
     //       .getAll()
     //       .filter(
       //         position =>
     //               position.status === "OPEN"
      //      );



    // =====================================
    // MIN BALANCE
    // =====================================

    if (
        currentBalance <=
        riskSettings.minBalanceToTrade
    ) {

        return {
            allowed:false,
            reason:"INSUFFICIENT_BALANCE"
        };

    }



    // =====================================
    // TRADE DIRECTION
    // =====================================

    const direction =
        riskSettings.tradeDirection;


    if (
        direction &&
        direction !== "BOTH"
    ) {


        if (
            direction !== side
        ) {

            return {
                allowed:false,
                reason:"TRADE_DIRECTION_BLOCK"
            };

        }

    }




    // =====================================
    // MAX OPEN POSITIONS
    // =====================================
     const openPositions =
    PositionStore.getAll().filter(
        p => p.status === "OPEN"
    );



    const maxOpen =
        riskSettings.protection
            ?.maxOpenPositions ?? 3;



    if (
        openPositions.length >= maxOpen
    ) {

        return {
            allowed:false,
            reason:"MAX_OPEN_POSITIONS"
        };

    }




    // =====================================
    // DAILY LOSS
    // =====================================

    if (
        RiskStore.getDailyLoss()
        >=
        (
            riskSettings.protection
            ?.maxDailyLoss ?? 5
        )
    ) {

        return {
            allowed:false,
            reason:"MAX_DAILY_LOSS"
        };

    }




    // =====================================
    // DRAWDOWN
    // =====================================

    if (
        RiskStore.getDrawdown()
        >=
        (
            riskSettings.protection
            ?.maxDrawdown ?? 10
        )
    ) {

        return {
            allowed:false,
            reason:"MAX_DRAWDOWN"
        };

    }




    // =====================================
    // CONSECUTIVE LOSS
    // =====================================

    const maxLosses =
        riskSettings.protection
        ?.stopAfterLosses ?? 5;



    if (
        RiskStore.getConsecutiveLosses()
        >= maxLosses
    ) {

        return {
            allowed:false,
            reason:"MAX_CONSECUTIVE_LOSSES"
        };

    }




    // =====================================
    // COOLDOWN
    // =====================================

    const cooldown =
        RiskStore.getCooldown();



    if (
        cooldown &&
        new Date() <
        new Date(cooldown)
    ) {

        return {
            allowed:false,
            reason:"COOLDOWN_ACTIVE"
        };

    }

   // =========================
// MAX CONSECUTIVE LOSSES
// =========================

//const maxLosses =
   // riskSettings.protection?.maxConsecutiveLosses ??
   // riskSettings.protection?.stopAfterLosses ??
   // 5;


//if (
 //   RiskStore.getConsecutiveLosses() >=
 //   maxLosses
//) {

   // return {
   //     allowed: false,
     //   reason: "MAX_CONSECUTIVE_LOSSES",
 //   };

//}



// =========================
// SESSION LIMIT
// =========================

const sessionLimit =
    riskSettings.protection?.tradingSessionLimit ??
    24;


const sessionStart =
    RiskStore.sessionStart ??
    new Date();


const hoursPassed =
    (
        new Date() -
        new Date(sessionStart)
    )
    /
    (1000 * 60 * 60);



if (
    hoursPassed >= sessionLimit
) {

    return {
        allowed: false,
        reason: "SESSION_LIMIT_REACHED",
    };

}


    // =====================================
    // MAX PORTFOLIO RISK
    // =====================================

    const portfolioRisk =
        openPositions.reduce(
            (sum, position) => {

                return (
                    sum +
                    Number(
                        position.riskAmount ?? 0
                    )
                );

            },
            0
        );



    const maxPortfolioRisk =
        currentBalance *
        (
            riskSettings.maxPortfolioRisk /
            100
        );



    if (
        portfolioRisk + riskAmount
        >
        maxPortfolioRisk
    ) {



        console.log("🔥 PORTFOLIO RISK CHECK:", {
    currentBalance,
    openPositionsCount: openPositions.length,
    portfolioRisk,
    newTradeRiskAmount: riskAmount,
    maxPortfolioRisk,
    maxPortfolioRiskPercent: riskSettings.maxPortfolioRisk,
    totalRiskAfterNewTrade:
        portfolioRisk + riskAmount
});

        return {
            allowed:false,
            reason:"MAX_PORTFOLIO_RISK"
        };

    }




    // =====================================
    // SESSION LIMIT
    // =====================================

    // فعلاً فقط ساختار آماده است
    // نیاز به sessionStart در RiskStore دارد



    return {

        allowed:true,

        reason:null

    };


}


}


export default RiskValidator;