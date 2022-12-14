import yahooFinance from "yahoo-finance2"
import redis from "../../lib/redis"

const handler = async (req: any, res: any) => {
  const name = req.query.name

  console.log("starting getOptions:", name)
  try {
    const key = `${name}`
    const cache = await redis.get(key)
    if (cache) {
      console.log(`key ${key} from cache`)
      res.json(cache)
      return
    }
    const queryOptions = {
      lang: "en-US",
      formatted: false,
      region: "US",
    }
    const result = await yahooFinance.options(name, queryOptions)
    let obj = {
      symbol: result.underlyingSymbol,
      expirationDates: result.expirationDates,
      strikes: result.strikes,
      price: result.quote.regularMarketPrice,
    }
    console.log(`sending ${key} to cache`)
    // cache for a day
    await redis.setex(key, 60 * 60 * 24, JSON.stringify(obj))
    res.json(obj)
  } catch (error: any) {
    console.log("error thrown in getOptions", error)
    res.json("Error: " + error.toString())
  }
}

export default handler
