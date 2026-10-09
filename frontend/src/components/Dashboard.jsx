export default function Dashboard({ market }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>📊 MTBP Live Dashboard</h2>

      {!market && <p>Waiting for market data...</p>}

      {market &&
        Object.keys(market).map((symbol) => (
          <div
            key={symbol}
            style={{
              padding: 10,
              margin: "10px 0",
              border: "1px solid #ddd",
              borderRadius: 8
            }}
          >
            <b>{symbol}</b>

            <div>
              Price: {market[symbol]?.price?.toFixed(2)}
            </div>

            <div>
              Volume: {market[symbol]?.volume?.toFixed(2)}
            </div>

            <div>
              Time: {new Date(market[symbol]?.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
    </div>
  );
}