import yahooFinance from "yahoo-finance2";
import redis from "../../lib/redis";

const handler = async (
  req: { query: { ticker: string; expirationDate: string } },
  res: any
) => {
  const ticker = req.query.ticker;
  const expirationDate = req.query.expirationDate;
  console.log("starting contractsByExpiration:", ticker, expirationDate);
  try {
    const key = `${ticker}:${expirationDate}`;
    const cache = await redis.get(key);
    if (cache) {
      console.log(`key ${key} from cache`);
      res.json(cache);
      return;
    }
    const queryOptions = {
      lang: "en-US",
      formatted: false,
      region: "US",
      date: expirationDate,
    };
    const result = await yahooFinance.options(ticker, queryOptions);
    const callsObjArr = result.options[0]["calls"].map((d) => {
      return {
        contractSymbol: d.contractSymbol,
        strike: d.strike,
        lastPrice: d.lastPrice,
      };
    });
    const putsObjArr = result.options[0]["puts"].map((d) => {
      return {
        contractSymbol: d.contractSymbol,
        strike: d.strike,
        lastPrice: d.lastPrice,
      };
    });
    const returnData = {
      ticker: ticker,
      date: expirationDate,
      calls: callsObjArr,
      puts: putsObjArr,
    };
    console.log(`sending ${key} to cache`);
    await redis.setex(key, 1800, JSON.stringify(returnData));
    res.json(returnData);
  } catch (error: any) {
    console.log("error thrown in getOptions", error);
    res.json("Error: " + error.toString());
  }
};

export default handler;
