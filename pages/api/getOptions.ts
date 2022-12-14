import yahooFinance from "yahoo-finance2"
import redis from "../../lib/redis"
//import type { NextApiRequest, NextApiResponse } from "next";
type Data = {
  data: Array<{
    name: string
    strike: number
    type: string
    date: string
  }>
}
const handler = async (
  req: { query: { name: string; optionDate: string; optionsType: string } },
  res: any
) => {
  const name = req.query.name as string
  const date = req.query.optionDate as string
  const optionsType = req.query.optionsType as string
  console.log("starting getOptions:", name, date, optionsType)
  try {
    const key = `${name}:${date}:${optionsType}`
    const cache = (await redis.get(key)) as Data
    if (cache) {
      console.log(`key ${key} from cache`)
      res.json(cache)
      return
    }
    const queryOptions = {
      lang: "en-US",
      formatted: false,
      region: "US",
      date,
    }
    const result = await yahooFinance.options(name, queryOptions)
    const callOrPuts = result.options[0][optionsType]
    const theData = callOrPuts.map(
      (d: { contractSymbol: string; strike: number; lastPrice: number }) => {
        return {
          contractSymbol: d.contractSymbol,
          strike: d.strike,
          lastPrice: d.lastPrice,
        }
      }
    )
    const data = {
      name: req.query.name,
      date: req.query.optionDate,
      optionsType: req.query.optionsType,
      data: theData,
    }
    console.log(`sending ${key} to cache`)
    await redis.setex(key, 1800, JSON.stringify(data))
    res.json(data)
  } catch (error: any) {
    console.log("error thrown in getOptions", error)
    //res.json(`Error: ${error.toString()}`);
    res.status(500).json({ success: false, error: error.toString() })
  }
}

export default handler
