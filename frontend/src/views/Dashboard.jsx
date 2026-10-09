import React from "react";

export default function Dashboard({ data }) {
console.log("DATA:", data);
  const candles = data?.candleCache || {};
  const rsi = data?.rsiCache || {};
  const ema = data?.emaCache || {};
  const macd = data?.macdCache || {};

  const symbols = Object.keys(candles);

  return (
    <div style={{ color: "white" }}>

      <h2>LIVE ENGINE DASHBOARD</h2>

      {symbols.map(symbol => {

        const closes = (candles[symbol] || []).map(c => c.close);
        const lastPrice = closes[closes.length - 1];

        return (
          <div key={symbol} style={{
            margin: "10px",
            padding: "10px",
            background: "#111826",
            borderRadius: "8px"
          }}>

            <h3>{symbol}</h3>

            {/* PRICE */}
            <div>Price: {lastPrice}</div>

            {/* RSI */}
            <div>RSI: {rsi[symbol]?.value || "N/A"}</div>

            {/* EMA */}
            <div>EMA: {ema[symbol]?.value || "N/A"}</div>

            {/* MACD */}
            <div>MACD: {macd[symbol]?.value || "N/A"}</div>

          </div>
        );
      })}

    </div>
  );
}