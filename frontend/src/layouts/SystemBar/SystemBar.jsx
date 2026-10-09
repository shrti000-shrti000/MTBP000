import React from "react";

import "./SystemBar.css";
import BotStatusSummary from "./Bot/BotStatusSummary";
import TotalBalance from "./TotalBalance/TotalBalance";
import TotalPnL from "./TotalPnL/TotalPnL";
import DailyPnL from "./today/DailyPnL";
import WeeklyPnL from "./WeeklyPnL/WeeklyPnL";
import TotalTrades from "./TotalTrades/TotalTrades";
import WinRate from "./WinRate/WinRate";
import SharpeRatio from "./SharpeRatio/SharpeRatio";
import VersionLabel from "./VersionLabel/VersionLabel";
import HeaderActions from "./Actions/HeaderActions";

export default function SystemBar() {
  return (
    <div className="systembar">

      <BotStatusSummary />
      <TotalBalance />
      <TotalPnL />
      <DailyPnL />
      <WeeklyPnL />
      <TotalTrades />
      <WinRate />
      <SharpeRatio />
      <VersionLabel />
      <HeaderActions />

    </div>
  );
}