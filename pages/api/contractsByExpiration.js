import yahooFinance from "yahoo-finance2"
import redis from "../../lib/redis"

const handler = async (req, res) => {
  const ticker = req.query.ticker
  const expirationDate = req.query.expirationDate
  const bustCache = req.query.bustCache
  const cacheTTL = req.query.cacheTTL
  console.log("starting contractsByExpiration:", ticker, expirationDate)
  try {
    const key = `${ticker}:${expirationDate}`
    if (bustCache == "true") {
      console.log("Busting redis cache")
    } else {
      const cache = await redis.get(key)
      if (cache) {
        console.log(`key ${key} from cache`)
        res.json(cache)
        return
      }
    }
    const queryOptions = {
      lang: "en-US",
      formatted: false,
      region: "US",
      date: expirationDate,
    }
    const result = await yahooFinance.options(ticker, queryOptions)
    const optionsData = result.options[0]
    console.log(result.options)
    const callsObjArr = optionsData.calls.map((d) => {
      return {
        contractSymbol: d.contractSymbol,
        strike: d.strike,
        lastPrice: d.lastPrice,
      }
    })
    const putsObjArr = optionsData.puts.map((d) => {
      return {
        contractSymbol: d.contractSymbol,
        strike: d.strike,
        lastPrice: d.lastPrice,
      }
    })
    const returnData = {
      ticker: ticker,
      date: expirationDate,
      calls: callsObjArr,
      puts: putsObjArr,
    }
    const ttl = cacheTTL ? cacheTTL : 1800
    console.log(`sending ${key} to cache with ttl ${ttl}`)
    await redis.setex(key, ttl, JSON.stringify(returnData))
    res.json(returnData)
  } catch (error) {
    console.log("error thrown in contractsByExpiration", error)
    res.json("Error: " + error.toString())
  }
}

export default handler
