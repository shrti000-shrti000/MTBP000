import fs from "fs";

export class ExchangeConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const raw = fs.readFileSync("./config/exchanges.json", "utf-8");
    return JSON.parse(raw);
  }

  getExchange(name) {
    return this.config[name];
  }

  getAll() {
    return this.config;
  }
}