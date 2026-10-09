import React from "react";
import "./TopBar.css";

import User from "./User/User";
import ActiveBot from "./ActiveBot/ActiveBot";
import ActiveSymbol from "./ActiveSymbol/ActiveSymbol";
import ConnectionStatus from "./ConnectionStatus/ConnectionStatus";
import Notifications from "./Notifications/Notifications";
import Settings from "./Settings/Settings";

export default function TopBar() {
  return (
    <div className="topbar">

      <div className="topbar-panel">
        <User />
      </div>

      <div className="topbar-panel">
        <ActiveBot />
      </div>

      <div className="topbar-panel">
        <ActiveSymbol />
      </div>

      <div className="topbar-panel">
        <ConnectionStatus />
      </div>

      <div className="topbar-panel">
        <Notifications />
      </div>

      <div className="topbar-panel">
        <Settings />
      </div>

    </div>
  );
}