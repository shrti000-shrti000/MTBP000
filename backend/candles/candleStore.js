import CandleRepository from "../storage/repositories/CandleRepository.js";

export class CandleStore {

  constructor(maxSize = 500) {

    this.maxSize = maxSize;

    // =========================
    // STRUCTURE
    // =========================

    this.data = Object.create(null);

    this.timeframes = [
      "1m",
      "5m",
      "15m",
      "30m",
      "1h",
      "4h",
    ];

    // =========================
    // DATABASE READY
    // =========================

    // مهم:
    // قبلاً اینجا کل دیتابیس لود می‌شد
    // و باعث مصرف چند GB RAM می‌شد.
    //
    // فعلاً هیچ دیتایی در Boot به RAM
    // منتقل نمی‌کنیم.
    //
    // تاریخچه فقط در صورت نیاز لود می‌شود.

    this.ready = Promise.resolve();

  }


  // ====================================
  // LOAD FROM POSTGRESQL
  // ====================================

  async loadFromDatabase(
    symbol,
    timeframe,
    exchange = "TOOBIT"
  ) {

    try {

      if (!symbol || !timeframe) {
        return;
      }

      this.initTimeframe(
        symbol,
        timeframe
      );

      const rows =
        await CandleRepository.findRecent(
          exchange,
          symbol,
          timeframe,
          this.maxSize
        );

      if (
        !Array.isArray(rows) ||
        !rows.length
      ) {
        return;
      }

      const candles =
        rows.map(
          row =>
            this.fromDatabaseRow(row)
        );

      this.data[symbol][timeframe] =
        candles.slice(-this.maxSize);

    }
    catch (error) {

      console.error(
        "❌ CANDLE STORE DATABASE LOAD ERROR:",
        error.message
      );

    }

  }


  // ====================================
  // LOAD HISTORY FOR ONE SYMBOL
  // ====================================

  async loadSymbol(
    symbol,
    exchange = "TOOBIT"
  ) {

    if (!symbol) {
      return;
    }

    for (
      const timeframe
      of this.timeframes
    ) {

      await this.loadFromDatabase(
        symbol,
        timeframe,
        exchange
      );

    }

  }


  // ====================================
  // DATABASE ROW -> CANDLE
  // ====================================

  fromDatabaseRow(row) {

    return {

      openTime:
        Number(row.open_time),

      open:
        Number(row.open),

      high:
        Number(row.high),

      low:
        Number(row.low),

      close:
        Number(row.close),

      volume:
        Number(row.volume),

    };

  }


  // ====================================
  // CANDLE -> DATABASE ROW
  // ====================================

  toDatabaseRow(
    exchange,
    symbol,
    timeframe,
    candle
  ) {

    return {

      exchange,

      symbol,

      timeframe,

      openTime:
        candle.openTime,

      open:
        candle.open,

      high:
        candle.high,

      low:
        candle.low,

      close:
        candle.close,

      volume:
        candle.volume,

    };

  }


  // ====================================
  // INIT SYMBOL
  // ====================================

  init(symbol) {

    if (!this.data[symbol]) {

      this.data[symbol] =
        Object.create(null);

      for (
        const tf
        of this.timeframes
      ) {

        this.data[symbol][tf] = [];

      }

    }

  }


  // ====================================
  // INIT TIMEFRAME
  // ====================================

  initTimeframe(
    symbol,
    timeframe
  ) {

    this.init(symbol);

    if (
      !this.data[symbol][timeframe]
    ) {

      this.data[symbol][timeframe] = [];

    }

  }


  // ====================================
  // LOAD HISTORY
  // ====================================

  addHistory(
    symbol,
    timeframe,
    candles = [],
    exchange = "TOOBIT"
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    const normalized =
      Array.isArray(candles)
        ? candles
            .filter(Boolean)
            .slice(-this.maxSize)
        : [];

    this.data[symbol][timeframe] =
      normalized;

    this.persistHistory(
      symbol,
      timeframe,
      normalized,
      exchange
    );

  }


  // ====================================
  // PERSIST HISTORY
  // ====================================

  async persistHistory(
    symbol,
    timeframe,
    candles,
    exchange = "TOOBIT"
  ) {

    try {

      for (
        const candle
        of candles
      ) {

        if (
          candle?.openTime === undefined ||
          candle?.openTime === null
        ) {

          continue;

        }

        await CandleRepository.upsert(

          this.toDatabaseRow(
            exchange,
            symbol,
            timeframe,
            candle
          )

        );

      }

    }
    catch (error) {

      console.error(
        "CANDLE HISTORY DATABASE PERSIST ERROR:",
        error.message
      );

    }

  }


  // ====================================
  // PUSH CLOSED CANDLE
  // ====================================

  push(
    symbol,
    timeframe,
    candle,
    exchange = "TOOBIT"
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    if (!candle) {
      return;
    }

    const arr =
      this.data[symbol][timeframe];

    const last =
      arr[arr.length - 1];

    // همان کندل
    if (
      last &&
      String(last.openTime) ===
        String(candle.openTime)
    ) {

      arr[arr.length - 1] =
        candle;

      this.persistCandle(
        symbol,
        timeframe,
        candle,
        exchange
      );

      return;

    }

    arr.push(candle);

    while (
      arr.length >
      this.maxSize
    ) {

      arr.shift();

    }

    this.persistCandle(
      symbol,
      timeframe,
      candle,
      exchange
    );

  }


  // ====================================
  // PERSIST ONE CANDLE
  // ====================================

  async persistCandle(
    symbol,
    timeframe,
    candle,
    exchange = "TOOBIT"
  ) {

    try {

      if (
        !candle ||
        candle.openTime === undefined ||
        candle.openTime === null
      ) {

        return;

      }

      await CandleRepository.upsert(

        this.toDatabaseRow(
          exchange,
          symbol,
          timeframe,
          candle
        )

      );

    }
    catch (error) {

      console.error(
        "CANDLE DATABASE PERSIST ERROR:",
        error.message
      );

    }

  }


  // ====================================
  // GET ALL
  // ====================================

  get(
    symbol,
    timeframe = "1m"
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    return this.data[symbol][timeframe];

  }


  // ====================================
  // LAST
  // ====================================

  last(
    symbol,
    timeframe = "1m"
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    const arr =
      this.data[symbol][timeframe];

    if (!arr.length) {
      return null;
    }

    return arr[arr.length - 1];

  }


  // ====================================
  // SIZE
  // ====================================

  size(
    symbol,
    timeframe = "1m"
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    return this.data[symbol][timeframe]
      .length;

  }


  // ====================================
  // CLEAR ONE TF
  // ====================================

  clear(
    symbol,
    timeframe
  ) {

    this.initTimeframe(
      symbol,
      timeframe
    );

    this.data[symbol][timeframe] =
      [];

  }


  // ====================================
  // CLEAR SYMBOL
  // ====================================

  clearSymbol(symbol) {

    this.init(symbol);

    for (
      const tf
      of this.timeframes
    ) {

      this.data[symbol][tf] = [];

    }

  }


  // ====================================
  // SNAPSHOT
  // ====================================

  snapshot() {

    return this.data;

  }


  // ====================================
  // AVAILABLE TIMEFRAMES
  // ====================================

  getTimeframes() {

    return [
      ...this.timeframes
    ];

  }

}


// ========================================
// DEFAULT INSTANCE
// ========================================

export default new CandleStore();