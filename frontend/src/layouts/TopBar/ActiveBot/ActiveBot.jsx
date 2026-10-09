
import { useEffect, useState } from "react";


// ============================================================
//              TRADING MODE CONTROL
// ============================================================
//
// LIVE  = سبز
// PAPER = نارنجی
//
// شرایط فعال شدن Trading Mode:
//
// 1. BOT باید RUNNING باشد
// 2. حداقل یک Exchange باید ENABLED باشد
//
// توجه:
//
// - Auto Trading شرط فعال شدن Trading Mode نیست.
// - Trading Mode خودش Bot را Start نمی‌کند.
// - Trading Mode خودش Exchange را Start نمی‌کند.
//
// ============================================================


// ============================================================
// UI SETTINGS
// ============================================================

const UI = {

  // ==========================================================
  // MAIN WIDGET
  // ==========================================================

  widget: {

    width: "100%",
    height: "70px",

    paddingTop: "7px",
    paddingRight: "9px",
    paddingBottom: "7px",
    paddingLeft: "9px",

    background: "#0b1220",

    border:
      "1px solid #1f2937",

    borderRadius: "10px",

    color: "#ffffff",

    boxSizing: "border-box",

    overflow: "hidden",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "5px",

  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {

    fontSize: "9px",

    fontWeight: "600",

    color: "#00d7ff",

    letterSpacing: "0.5px",

    lineHeight: "10px",

    marginBottom: "0px",

  },


  // ==========================================================
  // MAIN ROW
  // ==========================================================

  modeRow: {

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: "6px",

    width: "100%",

  },


  // ==========================================================
  // CURRENT STATUS
  // ==========================================================

  status: {

    display: "flex",

    alignItems: "center",

    gap: "4px",

    minWidth: "48px",

    fontSize: "10px",

    fontWeight: "700",

    lineHeight: "12px",

  },


  // ==========================================================
  // STATUS DOT
  // ==========================================================

  statusDot: {

    fontSize: "9px",

  },


  // ==========================================================
  // BUTTON GROUP
  // ==========================================================

  selector: {

    display: "flex",

    alignItems: "center",

    gap: "3px",

  },


  // ==========================================================
  // MODE BUTTON
  // ==========================================================

  modeButton: {

    height: "25px",

    minWidth: "50px",

    paddingTop: "0px",

    paddingRight: "7px",

    paddingBottom: "0px",

    paddingLeft: "7px",

    borderRadius: "6px",

    borderWidth: "1px",

    borderStyle: "solid",

    fontSize: "9px",

    fontWeight: "700",

    letterSpacing: "0.3px",

    cursor: "pointer",

    boxSizing: "border-box",

    transition:
      "all 0.15s ease",

  },


  // ==========================================================
  // PAPER COLORS
  // ==========================================================

  paper: {

    activeBackground:
      "#f97316",

    activeText:
      "#ffffff",

    activeBorder:
      "#f97316",

    inactiveBackground:
      "#111827",

    inactiveText:
      "#64748b",

    inactiveBorder:
      "#334155",

  },


  // ==========================================================
  // LIVE COLORS
  // ==========================================================

  live: {

    activeBackground:
      "#22c55e",

    activeText:
      "#ffffff",

    activeBorder:
      "#22c55e",

    inactiveBackground:
      "#111827",

    inactiveText:
      "#64748b",

    inactiveBorder:
      "#334155",

  },


  // ==========================================================
  // LOCKED COLORS
  // ==========================================================

  lockedBackground:
    "#0f172a",

  lockedText:
    "#475569",

  lockedBorder:
    "#1e293b",

  lockedInfoColor:
    "#64748b",


  // ==========================================================
  // INFORMATION TEXT
  // ==========================================================

  info: {

    fontSize: "7px",

    fontWeight: "600",

    letterSpacing: "0.4px",

    lineHeight: "8px",

    textAlign: "right",

    marginTop: "0px",

  },


  // ==========================================================
  // PAPER INFORMATION
  // ==========================================================

  paperInfoColor:
    "#fdba74",


  // ==========================================================
  // LIVE INFORMATION
  // ==========================================================

  liveInfoColor:
    "#86efac",


  // ==========================================================
  // LOADING COLOR
  // ==========================================================

  loadingColor:
    "#94a3b8",

};



// ============================================================
// API SETTINGS
// ============================================================

const API = {

  baseUrl:
    "http://localhost:3000",

  tradingModeEndpoint:
    "/api/trading-mode",

  botStatusEndpoint:
    "/api/bot/status",

};



// ============================================================
// COMPONENT
// ============================================================

export default function TradingModeControl() {


  // ==========================================================
  // CURRENT MODE
  // ==========================================================

  const [mode, setMode] =
    useState("PAPER");


  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(true);


  // ==========================================================
  // CHANGING MODE
  // ==========================================================

  const [changing, setChanging] =
    useState(false);


  // ==========================================================
  // BOT STATUS
  // ==========================================================

  const [botStatus, setBotStatus] =
    useState("STOPPED");


  // ==========================================================
  // EXCHANGE STATUS
  //
  // اینجا فقط برای تشخیص اینکه حداقل یک Exchange
  // فعال شده یا خیر استفاده می‌شود.
  // ==========================================================

  const [exchangeEnabled, setExchangeEnabled] =
    useState(false);


  // ==========================================================
  // STATUS LOADING
  // ==========================================================

  const [statusLoading, setStatusLoading] =
    useState(true);



  // ==========================================================
  // LOAD TRADING MODE
  // ==========================================================

  const loadTradingMode =
    async () => {

      try {

        const response =
          await fetch(
            `${API.baseUrl}${API.tradingModeEndpoint}`
          );


        if (!response.ok) {

          throw new Error(
            `HTTP ${response.status}`
          );

        }


        const data =
          await response.json();


        if (
          data?.success &&
          data?.mode
        ) {

          setMode(

            String(data.mode)
              .trim()
              .toUpperCase()

          );

        }

      }
      catch (error) {

        console.error(
          "TRADING MODE LOAD ERROR:",
          error
        );

      }
      finally {

        setLoading(false);

      }

    };



  // ==========================================================
  // LOAD BOT + EXCHANGE STATUS
  // ==========================================================

  const loadSystemStatus =
    async () => {

      try {

        const response =
          await fetch(
            `${API.baseUrl}${API.botStatusEndpoint}`
          );


        if (!response.ok) {

          throw new Error(
            `HTTP ${response.status}`
          );

        }


        const data =
          await response.json();


        if (!data?.success) {

          throw new Error(
            "BOT STATUS REQUEST FAILED"
          );

        }


        // ====================================================
        // BOT STATUS
        // ====================================================

        const nextBotStatus =
          String(
            data?.bot?.status ||
            "STOPPED"
          )
            .trim()
            .toUpperCase();


        setBotStatus(
          nextBotStatus
        );


        // ====================================================
        // EXCHANGE STATUS
        //
        // حداقل یک Exchange باید ENABLED باشد.
        // ====================================================

        const exchanges =
          Array.isArray(
            data?.exchanges
          )
            ? data.exchanges
            : [];


        const hasEnabledExchange =
          exchanges.some(
            (exchange) =>
              Boolean(
                exchange?.enabled
              )
          );


        setExchangeEnabled(
          hasEnabledExchange
        );

      }
      catch (error) {

        console.error(
          "TRADING MODE SYSTEM STATUS ERROR:",
          error
        );

        // در صورت قطع Backend
        // Trading Mode باید قفل شود.

        setBotStatus(
          "STOPPED"
        );

        setExchangeEnabled(
          false
        );

      }
      finally {

        setStatusLoading(false);

      }

    };



  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadTradingMode();

    loadSystemStatus();

    const interval =
      setInterval(
        loadSystemStatus,
        3000
      );


    return () =>
      clearInterval(
        interval
      );

  }, []);



  // ==========================================================
  // TRADING MODE ENABLE CONDITION
  // ==========================================================
  //
  // Trading Mode فقط وقتی فعال است که:
  //
  // BOT = RUNNING
  //
  // و حداقل یک Exchange = ENABLED
  //
  // ==========================================================

  const tradingModeEnabled =
    botStatus === "RUNNING" &&
    exchangeEnabled;



  // ==========================================================
  // TRADING MODE LOCK
  // ==========================================================

  const tradingModeLocked =
    loading ||
    statusLoading ||
    changing ||
    !tradingModeEnabled;



  // ==========================================================
  // LOCK REASON
  // ==========================================================

  const getLockReason =
    () => {

      if (loading) {

        return "LOADING...";

      }


      if (statusLoading) {

        return "CHECKING SYSTEM...";

      }


      if (changing) {

        return "CHANGING MODE...";

      }


      if (
        botStatus !==
        "RUNNING"
      ) {

        return (
          `BOT ${botStatus} — TRADING MODE LOCKED`
        );

      }


      if (
        !exchangeEnabled
      ) {

        return (
          "EXCHANGE DISABLED — TRADING MODE LOCKED"
        );

      }


      return "";

    };



  // ==========================================================
  // CHANGE MODE
  // ==========================================================

  const changeMode =
    async (
      newMode
    ) => {


      // ========================================================
      // FRONTEND SAFETY LOCK
      // ========================================================

      if (
        tradingModeLocked
      ) {

        console.warn(
          "TRADING MODE LOCKED:",
          getLockReason()
        );

        return;

      }


      // ========================================================
      // SAME MODE
      // ========================================================

      if (
        newMode ===
        mode
      ) {

        return;

      }



      // ========================================================
      // LIVE WARNING
      // ========================================================

      if (
        newMode ===
        "LIVE"
      ) {

        const confirmed =
          window.confirm(

            "⚠️ LIVE TRADING\n\n" +

            "Real orders may be sent to the exchange.\n\n" +

            "Are you sure you want to switch to LIVE mode?"

          );


        if (!confirmed) {

          return;

        }

      }



      // ========================================================
      // START CHANGING
      // ========================================================

      setChanging(
        true
      );



      try {

        const response =
          await fetch(

            `${API.baseUrl}${API.tradingModeEndpoint}`,

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  mode:
                    newMode,

                }),

            }

          );



        const data =
          await response.json();



        // ====================================================
        // BACKEND REJECTED REQUEST
        // ====================================================

        if (
          !response.ok ||
          !data?.success
        ) {

          console.error(

            "TRADING MODE CHANGE FAILED:",

            data

          );

          return;

        }



        // ====================================================
        // BACKEND SOURCE OF TRUTH
        // ====================================================

        const confirmedMode =

          String(
            data.mode ||
            newMode
          )
            .trim()
            .toUpperCase();



        setMode(
          confirmedMode
        );


      }
      catch (error) {

        console.error(

          "TRADING MODE CHANGE ERROR:",

          error

        );

      }
      finally {

        setChanging(
          false
        );

      }

    };



  // ==========================================================
  // CURRENT MODE COLOR
  // ==========================================================

  const currentModeColor =

    mode ===
    "LIVE"

      ? UI.live.activeBackground

      : UI.paper.activeBackground;



  // ==========================================================
  // BUTTON STYLE
  // ==========================================================

  const getButtonStyle =
    (
      buttonMode
    ) => {


      const active =
        mode ===
        buttonMode;


      const colors =
        buttonMode ===
        "LIVE"

          ? UI.live

          : UI.paper;



      // ======================================================
      // LOCKED STYLE
      // ======================================================

      if (
        tradingModeLocked
      ) {

        return {

          ...UI.modeButton,

          background:
            UI.lockedBackground,

          color:
            UI.lockedText,

          borderColor:
            UI.lockedBorder,

          opacity:
            0.65,

          cursor:
            "not-allowed",

        };

      }



      // ======================================================
      // NORMAL STYLE
      // ======================================================

      return {

        ...UI.modeButton,

        background:

          active

            ? colors.activeBackground

            : colors.inactiveBackground,


        color:

          active

            ? colors.activeText

            : colors.inactiveText,


        borderColor:

          active

            ? colors.activeBorder

            : colors.inactiveBorder,


        opacity:
          changing
            ? 0.65
            : 1,


        cursor:
          changing
            ? "not-allowed"
            : "pointer",

      };

    };



  // ==========================================================
  // STATUS DISPLAY
  // ==========================================================

  const statusDisplayText =

    loading ||
    statusLoading ||
    changing

      ? "..."

      : mode;



  // ==========================================================
  // STATUS DISPLAY COLOR
  // ==========================================================

  const statusDisplayColor =

    tradingModeLocked

      ? UI.lockedText

      : currentModeColor;



  // ==========================================================
  // INFORMATION MESSAGE
  // ==========================================================

  const informationText =

    tradingModeLocked

      ? getLockReason()

      : mode === "LIVE"

        ? "REAL ORDERS ENABLED"

        : "SIMULATION MODE";



  const informationColor =

    tradingModeLocked

      ? UI.lockedInfoColor

      : mode === "LIVE"

        ? UI.liveInfoColor

        : UI.paperInfoColor;



  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div
      style={
        UI.widget
      }
    >


      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        style={
          UI.header
        }
      >

        TRADING MODE

      </div>



      {/* ====================================================
          MAIN ROW
      ==================================================== */}

      <div
        style={
          UI.modeRow
        }
      >


        {/* =================================================
            CURRENT STATUS
        ================================================= */}

        <div
          style={{

            ...UI.status,

            color:
              statusDisplayColor,

          }}
        >

          <span
            style={
              UI.statusDot
            }
          >

            ●

          </span>


          <span>

            {
              statusDisplayText
            }

          </span>

        </div>



        {/* =================================================
            MODE BUTTONS
        ================================================= */}

        <div
          style={
            UI.selector
          }
        >


          {/* ==============================================
              PAPER
          =============================================== */}

          <button

            type="button"

            disabled={
              tradingModeLocked
            }

            onClick={() =>
              changeMode(
                "PAPER"
              )
            }

            style={
              getButtonStyle(
                "PAPER"
              )
            }

          >

            PAPER

          </button>



          {/* ==============================================
              LIVE
          =============================================== */}

          <button

            type="button"

            disabled={
              tradingModeLocked
            }

            onClick={() =>
              changeMode(
                "LIVE"
              )
            }

            style={
              getButtonStyle(
                "LIVE"
              )
            }

          >

            LIVE

          </button>


        </div>

      </div>



      {/* ====================================================
          MODE INFORMATION
      ==================================================== */}

      <div

        style={{

          ...UI.info,

          color:
            informationColor,

        }}

      >

        {
          informationText
        }

      </div>


    </div>

  );

}

