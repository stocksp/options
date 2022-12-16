import redis from "../../lib/redis"
import path from "path"
import { promises as fs } from "fs"

type info = {
  ticker: string
  name: string
}
type Data = {
  body: Array<info>
}
type theObj = {
  name: string
  ticker: string
}
const handler = async (req: any, res: any) => {
  console.log("starting getTickerSymbols:")
  try {
    const key = "tickerSymbols"
    const cache = (await redis.get(key)) as Data
    if (cache) {
      console.log(`key ${key} from cache`)
      res.json(cache)
      return
    }
    //Find the absolute path of the json directory
    const dataDirectory = path.join(process.cwd(), "data")
    //Read the json data file data.json
    const fileContents = await fs.readFile(dataDirectory + "/cboesymboldirequityindex.csv", "utf8")

    let array = fileContents.toString().split("\n")
    // we have strings in strings so strip one out
    array = array.map((x) => x.replaceAll('"', ""))
    let result = []
    // need to traverse remaining n-1 rows.
    for (let i = 1; i < array.length - 1; i++) {
      let obj = {} as theObj
      let strArray = array[i].split(",")

      obj["ticker"] = strArray[1]
      obj["name"] = strArray[0]
      // Add the generated object to our
      // result array
      result.push(obj)
    }
    
    console.log(`sending ${key} to cache`)
    await redis.set(key, JSON.stringify(result))
    res.status(200).json(result)
  } catch (error: any) {
    console.log("error thrown in getOptions", error)

    res.status(500).json({ success: false, error: error.toString() })
  }
}

export default handler
