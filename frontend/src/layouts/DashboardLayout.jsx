import React from "react";
import "./layout.css";

import TopBar from "./TopBar/TopBar";
import SystemBar from "./SystemBar/SystemBar";
import LeftSidebar from "./LeftSidebar/LeftSidebar";

import DashboardPage from "../pages/Dashboard/DashboardPage";
import BotPage from "../pages/Bot/BotPage";
import BotParametersPage from "../pages/BotParameters/BotParametersPage";
import MarketPage from "../pages/Market/MarketPage";
import ChartPage from "../pages/Chart/ChartPage";
import TradePage from "../pages/Trade/TradePage";
import PositionsPage from "../pages/Positions/PositionsPage";

export default function DashboardLayout({
  activePage,
  setActivePage,
}) {
  return (
    <>
      {/* ✅ هر دو نوار بالا باید باشند */}
      <TopBar />
      <SystemBar />

      <div className="main-layout">
        <LeftSidebar setActivePage={setActivePage} />

        <div className="main-content">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "bot" && <BotPage />}
          {activePage === "botparameters" && <BotParametersPage />}
          {activePage === "market" && <MarketPage />}

          {/* ❌ اینجا هم باگ داشتی */}
          {activePage === "chart" && <ChartPage />}

          {activePage === "trade" && <TradePage />}
          {activePage === "positions" && <PositionsPage />}

          {!activePage && (
            <div style={{ color: "white", padding: "30px" }}>
              Select Page
            </div>
          )}
        </div>
      </div>
    </>
  );
}