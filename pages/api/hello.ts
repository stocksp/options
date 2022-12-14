// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next"
import redis from "../../lib/redis"
type Data = {
  count: number
  someData: {
    name: string
    pets: Array<{
      name: string
      species: string
      age: number
      isMammal: boolean
    }>
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const count = await redis.incr("counter")
  const someData = {
    name: "Roberta McDonald",
    pets: [
      {
        name: "Rex",
        species: "dog",
        age: 3,
        isMammal: true,
      },
      {
        name: "Goldie",
        species: "fish",
        age: 2,
        isMammal: false,
      },
    ],
  }
  await redis.set("paulTest", JSON.stringify(someData))
  res.status(200).json({ count, someData })
}
