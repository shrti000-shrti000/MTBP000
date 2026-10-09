import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export function useDashboardData() {
  const [data, setData] = useState({});

  useEffect(() => {

    socket.on("candles", (candleCache) => {
      setData(prev => ({ ...prev, candleCache }));
    });

    socket.on("rsi", (rsiCache) => {
      setData(prev => ({ ...prev, rsiCache }));
    });

    socket.on("ema", (emaCache) => {
      setData(prev => ({ ...prev, emaCache }));
    });

    socket.on("macd", (macdCache) => {
      setData(prev => ({ ...prev, macdCache }));
    });

    socket.on("volume", (volumeCache) => {
      setData(prev => ({ ...prev, volumeCache }));
    });

  }, []);

  return data;
}