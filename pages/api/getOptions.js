import yahooFinance from "yahoo-finance2";
import redis from "../../lib/redis";

const handler = async (req, res) => {
    const name = req.query.name;
    const date = req.query.optionDate;
    const optionsType = req.query.optionsType;
    console.log("starting getOptions:", name, date, optionsType);
    try {
        const key = `${name}:${date}:${optionsType}`;
        const cache = await redis.get(key);
        if(cache) {
            console.log(`key ${key} from cache`);
            res.json(cache);
            return;
        }
        const queryOptions = {
            lang: "en-US",
            formatted: false,
            region: "US",
            date,
        };
        const result = await yahooFinance.options(name, queryOptions);
        const callOrPuts = result.options[0][optionsType];
        const theData = callOrPuts.map(d => {
            return {
                "contractSymbol": d.contractSymbol,
                "strike": d.strike,
                "lastPrice": d.lastPrice,
            }
        });
        const data = {
            name: req.query.name,
            date: req.query.optionDate,
            optionsType: req.query.optionsType,
            data: theData,

        };
        console.log(`sending ${key} to cache`)
        await redis.setex(key, 1800, JSON.stringify(data));
        res.json(data);
    } catch (error) {
        console.log("error thrown in getOptions", error);
        res.json("Error: " + error.toString());
    }
};

export default handler;
