export class VolumeTracker {
  constructor() {
    this.data = Object.create(null);
  }

  // =========================
  // init symbol
  // =========================
  init(symbol) {
    if (!this.data[symbol]) {
      this.data[symbol] = {
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        lastPrice: null,
        lastUpdate: null
      };
    }
  }

  // =========================
  // update volume from tick
  // =========================
  update(tick) {
    const { symbol, price, volume, time } = tick;

    if (!symbol || !price) return;

    this.init(symbol);

    const v = volume || 0;
    const item = this.data[symbol];

    item.totalVolume += v;

    // =========================
    // فشار خرید / فروش ساده
    // =========================
    if (item.lastPrice === null || price >= item.lastPrice) {
      item.buyVolume += v;
    } else {
      item.sellVolume += v;
    }

    item.lastPrice = price;
    item.lastUpdate = time || Date.now();
  }

  // =========================
  // get symbol volume
  // =========================
  get(symbol) {
    return this.data[symbol] || null;
  }

  // =========================
  // snapshot all
  // =========================
  snapshot() {
    return this.data;
  }

  // =========================
  // reset symbol
  // =========================
  reset(symbol) {
    if (this.data[symbol]) {
      this.data[symbol] = {
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        lastPrice: null,
        lastUpdate: null
      };
    }
  }
}