class ActiveSymbolsStore {

    constructor() {

        this.symbols = [];

    }

    setSymbols(symbols) {

        this.symbols = symbols;

    }

    getSymbols() {

        return this.symbols;

    }

    has(symbol) {

        return this.symbols.includes(symbol);

    }

}

export default new ActiveSymbolsStore();