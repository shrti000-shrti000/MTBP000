import { useEffect, useState } from "react";

export default function BotMainControl() {

  // =========================================================
  // BOT STATUS
  // وضعیت فعلی ربات
  //
  // Running = در حال اجرا
  // Stopped = متوقف
  // Paused  = توقف موقت
  // Frozen  = فریز
  // =========================================================

  const [botStatus, setBotStatus] = useState("Stopped");


  // =========================================================
  // ELAPSED TIME
  // زمان سپری شده ربات بر حسب ثانیه
  // =========================================================

  const [elapsedSeconds, setElapsedSeconds] = useState(0);


  // =========================================================
  // START TIME
  // زمان شروع اجرای ربات
  // =========================================================

  const [startTime, setStartTime] = useState(null);


  // =========================================================
  // LAST STATE CHANGE
  // زمان آخرین تغییر وضعیت ربات
  //
  // توجه:
  // اسم این State عمداً با متغیرهای نمایشی متفاوت است
  // تا خطای Duplicate Identifier ایجاد نشود.
  // =========================================================

  const [
    lastStateChangeTimestamp,
    setLastStateChangeTimestamp
  ] = useState(null);


  useEffect(() => {

  const loadBotStatus = async () => {

    try {

      const response = await fetch(
        "http://localhost:3000/api/bot/status"
      );

      const data = await response.json();

      if (!data?.success || !data?.bot) {
        return;
      }

      const bot = data.bot;

      const statusMap = {
        RUNNING: "Running",
        STOPPED: "Stopped",
        PAUSED: "Paused",
        FROZEN: "Frozen",
      };

      setBotStatus(
        statusMap[bot.status] || "Stopped"
      );

      setStartTime(
        bot.startedAt || null
      );

      setLastStateChangeTimestamp(
        bot.lastStateChange || null
      );

      if (
        bot.status === "RUNNING" &&
        bot.startedAt
      ) {

        setElapsedSeconds(
          Math.floor(
            (Date.now() - bot.startedAt) / 1000
          )
        );

      } else {

        setElapsedSeconds(0);

      }

    } catch (error) {

      console.error(
        "BOT STATUS LOAD ERROR:",
        error
      );

    }

  };


  loadBotStatus();

}, []);


  // =========================================================
  // TIMER ENGINE
  //
  // وقتی Bot روی Running باشد Timer هر ثانیه آپدیت می‌شود.
  //
  // وقتی:
  // STOP
  // PAUSE
  // FREEZE
  //
  // زده شود، Timer متوقف می‌شود ولی مقدار آن حفظ می‌شود.
  // =========================================================

  useEffect(() => {

    if (
      botStatus !== "Running" ||
      startTime === null
    ) {
      return;
    }


    const timer = setInterval(() => {

      const now = Date.now();


      const elapsed = Math.floor(
        (now - startTime) / 1000
      );


      setElapsedSeconds(elapsed);

    }, 1000);


    return () => {
      clearInterval(timer);
    };

  }, [botStatus, startTime]);


  // =========================================================
  // FORMAT RUNNING TIME
  //
  // تبدیل ثانیه به:
  //
  // HH:MM:SS
  //
  // مثال:
  // 17 → 00:00:17
  // =========================================================

  const formatElapsedTime = (totalSeconds) => {

    const hours = Math.floor(
      totalSeconds / 3600
    );


    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );


    const seconds =
      totalSeconds % 60;


    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0")
    );
  };


  // =========================================================
  // FORMAT CLOCK TIME
  //
  // نمایش ساعت واقعی سیستم:
  //
  // HH:MM:SS
  // =========================================================

  const formatClockTime = (timestamp) => {

    if (!timestamp) {
      return "--:--:--";
    }


    const date = new Date(timestamp);


    const hours = String(
      date.getHours()
    ).padStart(2, "0");


    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");


    const seconds = String(
      date.getSeconds()
    ).padStart(2, "0");


    return `${hours}:${minutes}:${seconds}`;
  };


  // =========================================================
  // STATUS COLOR
  //
  // رنگ وضعیت ربات
  // =========================================================

  const statusColor = (status) => {

    if (status === "Running") {
      return "#22c55e";
    }


    if (status === "Stopped") {
      return "#ef4444";
    }


    if (status === "Paused") {
      return "#f59e0b";
    }


    if (status === "Frozen") {
      return "#7c3aed";
    }


    return "#94a3b8";
  };


  // =========================================================
  // BOT ACTIONS
  //
  // کنترل چهار دکمه اصلی
  //
  // START
  // STOP
  // PAUSE
  // FREEZE
  //
  // در مرحله اتصال Backend، APIها را در همین بخش
  // اضافه می‌کنیم.
  // =========================================================

  const handleAction = async (action) => {

    const endpoints = {

      START:
        "http://localhost:3000/api/bot/start",

      STOP:
        "http://localhost:3000/api/bot/stop",

      PAUSE:
        "http://localhost:3000/api/bot/pause",

      FREEZE:
        "http://localhost:3000/api/bot/freeze",

    };


    const endpoint =
      endpoints[action];


    if (!endpoint) {
      return;
    }


    try {

      const response = await fetch(
        endpoint,
        {
          method: "POST",
        }
      );


      const data =
        await response.json();


      if (
        !data?.success ||
        !data?.bot
      ) {

        console.error(
          "BOT ACTION FAILED:",
          data
        );

        return;

      }


      const bot =
        data.bot;


      const statusMap = {

        RUNNING: "Running",

        STOPPED: "Stopped",

        PAUSED: "Paused",

        FROZEN: "Frozen",

      };


      // ================================================
      // Backend منبع اصلی وضعیت است
      // ================================================

      setBotStatus(
        statusMap[bot.status] ||
        "Stopped"
      );


      setStartTime(
        bot.startedAt ||
        null
      );


      setLastStateChangeTimestamp(
        bot.lastStateChange ||
        null
      );


      if (
        bot.status === "RUNNING" &&
        bot.startedAt
      ) {

        setElapsedSeconds(

          Math.floor(

            (
              Date.now() -
              bot.startedAt

            ) / 1000

          )

        );

      }


    } catch (error) {

      console.error(
        "BOT ACTION ERROR:",
        error
      );

    }

  };
  // =========================================================
  // RESET TIMER
  //
  // صفر کردن Running Time
  //
  // اگر Bot در حالت Running باشد:
  // Timer از همان لحظه دوباره شروع می‌شود.
  //
  // اگر Bot متوقف/Paused/Frozen باشد:
  // Timer روی صفر می‌ماند.
  // =========================================================

  const resetTimer = () => {

    const now = Date.now();


    setElapsedSeconds(0);


    if (botStatus === "Running") {

      setStartTime(now);

    } else {

      setStartTime(null);
    }


    setLastStateChangeTimestamp(now);
  };


  // =========================================================
  // DISPLAY VALUES
  //
  // مقادیر مخصوص نمایش UI
  //
  // توجه:
  // نام این متغیرها با Stateهای بالا متفاوت است.
  // =========================================================

  const runningTimeDisplay =
    formatElapsedTime(
      elapsedSeconds
    );


  const startedAtDisplay =
    formatClockTime(
      startTime
    );


  const lastStateChangeDisplay =
    formatClockTime(
      lastStateChangeTimestamp
    );


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div
      style={{
        background: "#0b1220",

        border:
          "1px solid #1f2937",

        borderRadius: "12px",

        padding: "10px",

        height: "70px",

        color: "#fff",

        display: "flex",

        flexDirection: "column",

        gap: "3px",

        fontSize: "11px",

        overflow: "hidden",

        boxSizing: "border-box",
      }}
    >


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div style={header}>

        <span>
      
        </span>

      </div>


      {/* =====================================================
          STATUS + RESET
      ===================================================== */}

      <div style={statusBar}>

        {/* وضعیت ربات */}

        <div style={smallStatus}>

          <span>
            Status:
          </span>


          <span
            style={{
              color:
                statusColor(botStatus),

              fontWeight: "600",
            }}
          >
            ● {botStatus}
          </span>

        </div>


        {/* RESET TIMER */}

        <button
          style={resetButton}
          onClick={resetTimer}
        >
          ↻ RESET TIMER
        </button>

      </div>


      {/* =====================================================
          MAIN CONTROL ROW
          
          7 آیتم افقی:
          
          1 START
          2 STOP
          3 PAUSE
          4 FREEZE
          5 RUNNING TIME
          6 STARTED AT
          7 LAST STATE CHANGE
      ===================================================== */}

      <div style={controlRow}>


        {/* ===================================================
            START
        =================================================== */}

        <button
          style={btn("#22c55e")}
          onClick={() =>
            handleAction("START")
          }
        >
          START
        </button>


        {/* ===================================================
            STOP
        =================================================== */}

        <button
          style={btn("#ef4444")}
          onClick={() =>
            handleAction("STOP")
          }
        >
          STOP
        </button>


        {/* ===================================================
            PAUSE
        =================================================== */}

        <button
          style={btn("#f59e0b")}
          onClick={() =>
            handleAction("PAUSE")
          }
        >
          PAUSE
        </button>


        {/* ===================================================
            FREEZE
        =================================================== */}

        <button
          style={btn("#7c3aed")}
          onClick={() =>
            handleAction("FREEZE")
          }
        >
          FREEZE
        </button>


        {/* ===================================================
            RUNNING TIME
        =================================================== */}

        <div style={infoBox}>

          <span
            style={{
              ...infoTitle,

              color:
                runningTimeTitleColor,

              fontSize:
                infoTitleFontSize,
            }}
          >
            RUNNING TIME
          </span>


          <strong
            style={{
              color:
                botStatus === "Running"
                  ? "#22c55e"
                  : "#64748b",

              fontFamily:
                "Consolas, 'Courier New', monospace",

              fontSize: "11px",

              lineHeight: "11px",
            }}
          >
            {runningTimeDisplay}
          </strong>

        </div>


        {/* ===================================================
            STARTED AT
        =================================================== */}

        <div style={infoBox}>

          <span
            style={{
              ...infoTitle,

              color:
                startedAtTitleColor,

              fontSize:
                infoTitleFontSize,
            }}
          >
            STARTED AT
          </span>


          <strong
            style={{
              color: "#e2e8f0",

              fontFamily:
                "Consolas, 'Courier New', monospace",

              fontSize: "11px",

              lineHeight: "11px",
            }}
          >
            {startedAtDisplay}
          </strong>

        </div>


        {/* ===================================================
            LAST STATE CHANGE
        =================================================== */}

        <div style={infoBox}>

          <span
            style={{
              ...infoTitle,

              color:
                lastStateChangeTitleColor,

              fontSize:
                infoTitleFontSize,
            }}
          >
            LAST STATE CHANGE
          </span>


          <strong
            style={{
              color: "#e2e8f0",

              fontFamily:
                "Consolas, 'Courier New', monospace",

              fontSize: "11px",

              lineHeight: "11px",
            }}
          >
            {lastStateChangeDisplay}
          </strong>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   VISUAL SETTINGS
========================================================= */


/* =========================================================
   ارتفاع همه ۷ آیتم
========================================================= */

const controlItemHeight = "30px";


/* =========================================================
   رنگ RUNNING TIME
========================================================= */

const runningTimeTitleColor = "#00d7ff";


/* =========================================================
   رنگ STARTED AT
========================================================= */

const startedAtTitleColor = "#00d7ff";


/* =========================================================
   رنگ LAST STATE CHANGE
========================================================= */

const lastStateChangeTitleColor = "#00d7ff";


/* =========================================================
   اندازه فونت عنوان‌های سه باکس
=========================================================

   6px = خیلی ریز
   7px = ریز
   8px = متوسط
   9px = درشت
   10px = بزرگ

========================================================= */

const infoTitleFontSize = "8px";


/* =========================================================
   HEADER
========================================================= */

const header = {

  display: "flex",

  alignItems: "center",

  color: "#00d7ff",

  fontWeight: "bold",

  fontSize: "11px",
};


/* =========================================================
   STATUS BAR
========================================================= */

const statusBar = {

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  minHeight: "18px",
};


/* =========================================================
   SMALL STATUS
========================================================= */

const smallStatus = {

  display: "flex",

  alignItems: "center",

  gap: "3px",

  color: "#64748b",

  fontSize: "9px",

  fontWeight: "500",
};


/* =========================================================
   MAIN CONTROL ROW
=========================================================

   7 ستون مساوی:

   START
   STOP
   PAUSE
   FREEZE
   RUNNING TIME
   STARTED AT
   LAST STATE CHANGE

========================================================= */

const controlRow = {

  display: "grid",

  /*
    ========================================================
    عرض ۷ آیتم به ترتیب:

    1 = START
    2 = STOP
    3 = PAUSE
    4 = FREEZE
    5 = RUNNING TIME
    6 = STARTED AT
    7 = LAST STATE CHANGE
    ========================================================
  */

  gridTemplateColumns:
    "45px 45px 45px 45px 70px 70px 100px",

  /*
    فاصله بین آیتم‌ها
  */
  gap: "3px",

  width: "100%",

  boxSizing: "border-box",
};


/* =========================================================
   MAIN BUTTON
========================================================= */

const btn = (color) => ({

  background: color,

  border: "none",

  color: "#fff",

  height:
    controlItemHeight,

  padding: "0 4px",

  borderRadius: "7px",

  cursor: "pointer",

  fontSize: "10px",

  fontWeight: "600",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxSizing: "border-box",
});


/* =========================================================
   INFORMATION BOX
=========================================================

   RUNNING TIME
   STARTED AT
   LAST STATE CHANGE

========================================================= */

const infoBox = {

  height:
    controlItemHeight,

  background: "#111827",

  border:
    "1px solid #1e293b",

  borderRadius: "7px",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  // فاصله عمودی عنوان و مقدار تقریباً صفر
  gap: "3px",

  padding: "0 2px",

  boxSizing: "border-box",

  overflow: "hidden",
};


/* =========================================================
   INFORMATION TITLE
========================================================= */

const infoTitle = {

  fontWeight: "600",

  letterSpacing: "0.4px",

  lineHeight: "8px",

  whiteSpace: "nowrap",
};


/* =========================================================
   RESET TIMER BUTTON
========================================================= */

const resetButton = {

  background: "#111827",

  border:
    "1px solid #334155",

  color: "#94a3b8",

  padding:
    "3px 8px",

  borderRadius: "5px",

  cursor: "pointer",

  fontSize: "8px",

  fontWeight: "600",

  letterSpacing: "0.3px",
};