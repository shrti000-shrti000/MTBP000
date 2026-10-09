import { useState } from "react";

export default function LeftSidebar({ setActivePage }) {

  const [active, setActive] = useState("Dashboard");

  const items = [
    "Dashboard",
    "Bot",
    "Bot Parameters",
    "Market",
    "Chart",
    "Strategy",
    "Trade",
    "Positions",
    "Performance",
    "System",
    "Logs",
    "Alerts",
    "User",
    "Multi Bot",
    "Arbitrage",
  ];

  return (
    <div
      style={{
        /* =========================
           🔥 SIDEBAR WIDTH (عرض کل ستون)
           ========================= */
        width: "120px",   // 👈 هرچی کمتر = باریک‌تر sidebar

        /* =========================
           🔥 مهم: ارتفاع کامل صفحه
           ========================= */
        height: "100vh",  // 👈 کل ارتفاع صفحه (خیلی مهم)

        /* =========================
           BACKGROUND (کل ستون یکدست)
           ========================= */
        background: "linear-gradient(180deg, #0f172a, #0b1220)",

        display: "flex",
        flexDirection: "column",

        paddingTop: "12px",

        borderRight: "1px solid rgba(255,255,255,0.06)",

        overflow: "hidden",
      }}
    >
      {items.map((item) => {

        const isActive = active === item;

        return (
          <div
            key={item}
            onClick={() => {
              setActive(item);

              /* =========================
                 🔥 NAVIGATION MAP
                 (اینجا مشخص میشه هر تب کجا بره)
                 ========================= */
              if (item === "Dashboard") setActivePage("dashboard");
              else if (item === "Bot") setActivePage("bot");
              else if (item === "Bot Parameters") setActivePage("botparameters"); // 👈 اصلاح شد (Bot Parameter غلط بود)
              else if (item === "Market") setActivePage("market");
              else if (item === "Chart") setActivePage("chart");
              else if (item === "Strategy") setActivePage("strategy");
              else if (item === "Trade") setActivePage("trade");
              else if (item === "Positions") setActivePage("positions");
              else if (item === "Performance") setActivePage("performance");
              else if (item === "System") setActivePage("system");
              else if (item === "Logs") setActivePage("logs");
              else if (item === "Alerts") setActivePage("alerts");
              else if (item === "User") setActivePage("user");
              else if (item === "Multi Bot") setActivePage("multibot");
              else if (item === "Arbitrage") setActivePage("arbitrage");
            }}

            style={{
              /* =========================
                 🔥 TAB SIZE (اندازه تب)
                 ========================= */

              height: "18px",   // 👈 ارتفاع تب (کم/زیاد = فشرده/بزرگ)
              width: "80px",    // 👈 عرض تب (مهم‌ترین برای فشرده شدن)

              margin: "3px auto", // 👈 وسط‌چین شدن داخل sidebar

              borderRadius: "10px",

              cursor: "pointer",

              /* =========================
                 🔥 FONT SIZE (اندازه نوشته)
                 ========================= */
              fontSize: "11px", // 👈 متن کوچک/بزرگ

              /* =========================
                 TEXT COLOR
                 ========================= */
              color: isActive ? "#fff" : "#94a3b8",

              /* =========================
                 ACTIVE BACKGROUND
                 ========================= */
              background: isActive
                ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                : "transparent",

              /* =========================
                 ACTIVE SHADOW
                 ========================= */
              boxShadow: isActive
                ? "0 8px 18px rgba(59,130,246,0.35)"
                : "none",

              /* =========================
                 🔥 CENTER TEXT (خیلی مهم)
                 ========================= */
              display: "flex",
              alignItems: "center",     // عمودی وسط
              justifyContent: "center", // افقی وسط

              /* =========================
                 ANIMATION
                 ========================= */
              transition: "0.2s",
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}