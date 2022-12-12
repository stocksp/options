// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// import { Redis } from "@upstash/redis";

// const redis = new Redis({
//   url: "https://usw1-stirring-sheepdog-33238.upstash.io",
//   token:
//     "AYHWASQgMjI2ZTMxNTYtN2U5Yi00ZTI1LThmZjMtODI0MTFmMzI3NDY3YjQ5N2YyNjU1NmU1NGI5ZDkyYmY3MzY0ZTA5NzI3MGQ=",
// });
import redis from "../../lib/redis";

export default async function handler(req, res) {
  const count = await redis.incr("counter");
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
  };
  await redis.set("paulTest", JSON.stringify(someData));
  res.status(200).json({ count, someData });
}
