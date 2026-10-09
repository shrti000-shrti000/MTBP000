import { useEffect, useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import wsClient from "./services/wsClient";

export default function App() {

  console.log("🔥 APP RUNNING");

  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    wsClient.connect();
  }, []);

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
    />
  );
}