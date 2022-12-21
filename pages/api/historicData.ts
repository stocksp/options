import yahooFinance from "yahoo-finance2"
import redis from "../../lib/redis"
import { format } from "date-fns"

const handler = async (req: any, res: any) => {
  const name = req.query.symbol
  const date = req.query.date

  console.log("starting historicData:", name, date)
  try {
    const key = `${name}:${date}`
    const cache = await redis.get(key)
    if (cache) {
      console.log(`key ${key} from cache`)
      res.json(cache)
      return
    }
    // add one day to the date to make the range work
    const endDate = new Date(Date.parse(date))
    endDate.setDate(endDate.getDate() + 1)

    const query = name
    const queryOptions = { period1: date, period2: endDate }
    const result = await yahooFinance.historical(query, queryOptions)
    console.log(`sending ${key} to cache`)
    // cache for a day
    // this value is history so maybe it should just stay
    // forever in the db???
    await redis.setex(key, 60 * 60 * 24, JSON.stringify(result))
    res.json(result)
  } catch (error: any) {
    console.log("error thrown in getOptions", error)
    res.json("Error: " + error.toString())
  }
}

export default handler
