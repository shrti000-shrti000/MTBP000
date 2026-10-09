import StrategyStateRepository from "../storage/repositories/StrategyStateRepository.js";


class StrategyStateStore {


    constructor(){

        this.state = new Map();

        this.repository =
            StrategyStateRepository;


        this.ready =
            this.load();

    }



    buildKey(
        exchange,
        symbol,
        timeframe
    ){

        return `${exchange}:${symbol}:${timeframe}`;

    }



    async load(){

     //   console.log(
      //      "📚 LOADING STRATEGY STATE"
      //  );


        const rows =
            await this.repository.getAll();


        for(const row of rows){


            const key =
                this.buildKey(
                    row.exchange,
                    row.symbol,
                    row.timeframe
                );


            this.state.set(
                key,
                row.state
            );

        }


     //   console.log(
      //      "✅ STRATEGY STATE LOADED:",
      //      rows.length
      //  );


    }



    get(
        exchange,
        symbol,
        timeframe
    ){

        const key =
            this.buildKey(
                exchange,
                symbol,
                timeframe
            );


        return this.state.get(key) ?? null;

    }



    async set(
        exchange,
        symbol,
        timeframe,
        value
    ){

        const key =
            this.buildKey(
                exchange,
                symbol,
                timeframe
            );


        this.state.set(
            key,
            value
        );


        await this.repository.save(
            exchange,
            symbol,
            timeframe,
            value
        );


        return value;

    }



    clear(){

        this.state.clear();

    }



}


export default new StrategyStateStore();