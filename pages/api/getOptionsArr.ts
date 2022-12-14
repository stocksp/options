import yahooFinance from "yahoo-finance2"
import redis from "../../lib/redis"

type info = {
  name: string
  strike: number
  type: string
  date: string
  contractSymbol?: string
  price?: number
  parentPrice?: number
  cached?: boolean
}
type Data = {
  body: Array<info>
}

const handler = async (req: any, res: any) => {
  const data = req.body.data
  // const foundData: Array<info> = [];

  console.log("starting getOptionsArr:", JSON.stringify(data))
  try {
    const all = await Promise.all(
      data.map(async (d: info) => {
        const key = `${d.name}:${d.date}:${d.type}:${d.strike}`
        const cache = (await redis.get(key)) as info
        if (cache) {
          return { ...cache, cached: true }
        } else {
          return { cached: false, ...d }
        }
      })
    )
    const todos = all.filter((d) => !d.cached)
    const foundData = all.filter((d) => d.cached)
    
    const result = await Promise.all(
      todos.map((todo: info) =>
        yahooFinance.options(todo.name, {
          lang: "en-US",
          formatted: false,
          region: "US",
          date: todo.date,
        })
      )
    )
    //console.log("result", JSON.stringify(result));
    let newData = [...todos]
    newData.forEach(async (obj) => {
      // for Redi
      const key = `${obj.name}:${obj.date}:${obj.type}:${obj.strike}`
      // first find all the results that match our symbol
      // we may have AAPL at two different expiration dates
      const foundResults = result.filter((r) => r.underlyingSymbol === obj.name)
      let done = false
      if (foundResults.length > 0) {
        // check if the objects expirationDate is what we are looking for
        // we need to look in ALL results that have obj.name we may have multiple requests at
        // different dates
        const foundExpireDate = foundResults.find(
          (r) => r.options[0].expirationDate.toISOString().substring(0, 10) === obj.date
        )
        // now we have a single result for our symbol and date
        // or we have an error (else below)
        if (foundExpireDate) {
          const theType = obj.type == "call" ? "calls" : "puts"
          // this will be the array of either puts or calls
          const putOrcalls = foundExpireDate.options[0][theType]
          // this will be the single put or call where we find the price
          const strike = putOrcalls.find((p: any) => p.strike === obj.strike)

          if (strike) {
            obj.contractSymbol = strike.contractSymbol
            obj.price = strike.lastPrice
            obj.parentPrice = foundExpireDate.quote.regularMarketPrice
            // both of these else may be overwritten if we find what we
            // are looking for on a subsequent obj
            await redis.setex(key, 1800, JSON.stringify(obj))
          } else {
            console.log("didn't find option")
            obj.price = -1
            // did find the parent price
            obj.parentPrice = foundExpireDate.quote.regularMarketPrice
          }
        } else {
          console.log("didn't find expireDate")
          obj.price = -1
          obj.parentPrice = -1
        }
      } else {
        console.log("didn't find result")
        obj.price = -1
        obj.parentPrice = -1
      }
    })
    foundData.push(...newData)
    console.log(`sending back: ${foundData.length}`)
    res.json(foundData)
  } catch (error: any) {
    console.log("error thrown in getOptions", error)
    res.json("Error: " + error.toString())
  }
}

export default handler
