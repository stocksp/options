import yahooFinance from "yahoo-finance2";
const handler = async (req, res) => {
  const name = req.query.name;

  console.log("starting getOptions:", name);
  try {
    const queryOptions = {
      lang: "en-US",
      formatted: false,
      region: "US",
    };
    const result = await yahooFinance.options(name, queryOptions);
    let obj = {
      symbol: result.underlyingSymbol,
      expirationDates: result.expirationDates,
      strikes: result.strikes,
      price: result.quote.regularMarketPrice,
    };
    res.json(obj);
  } catch (error) {
    console.log("error thrown in getOptions", error);
    res.json("Error: " + error.toString());
  }
};

export default handler;
