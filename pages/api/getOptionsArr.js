import yahooFinance from "yahoo-finance2";
const handler = async (req, res) => {
  const data = req.body.data;

  console.log("starting getOptionsArr:", JSON.stringify(data));
  try {
    const result = await Promise.all(
      data.map((todo) =>
        yahooFinance.options(todo.name, {
          lang: "en-US",
          formatted: false,
          region: "US",
          date: todo.date,
        })
      )
    );
    //console.log("result", JSON.stringify(result));
    let newData = [...data];
    newData.forEach((obj) => {
      // first find all the results that match our symbol
      // we may have AAPL at two different expiration dates
      const foundResults = result.filter(
        (r) => r.underlyingSymbol === obj.name
      );
      let done = false;
      if (foundResults.length > 0) {
        // check if the objects expirationDate is what we are looking for
        // we need to look in ALL results that have obj.name we may have multiple requests at
        // different dates
        const foundExpireDate = foundResults.find(
          (r) =>
            r.options[0].expirationDate.toISOString().substring(0, 10) ===
            obj.date
        );
        // now we have a single result for our symbol and date
        // or we have an error (else below)
        if (foundExpireDate) {
          const theType = obj.type == "call" ? "calls" : "puts";
          // this will be the array of either puts or calls
          const putOrcalls = foundExpireDate.options[0][theType];
          // this will be the single put or call where we find the price
          const strike = putOrcalls.find((p) => p.strike === obj.strike);
          
          if (strike) {
            obj.contractSymbol = strike.contractSymbol;
            obj.price = strike.lastPrice;
            obj.parentPrice = foundExpireDate.quote.regularMarketPrice;
            // both of these else may be overwritten if we find what we
            // are looking for on a subsequent obj
          } else {
            console.log("didn't find option");
            obj.price = -1;
          }
        } else {
          console.log("didn't find expireDate");
          obj.price = -1;
          obj.parentPrice = -1;
        }
      } else {
        console.log("didn't find result");
        obj.price = -1;
        obj.parentPrice = -1;
      }
    });

    res.json(newData);
  } catch (error) {
    console.log("error thrown in getOptions", error);
    res.json("Error: " + error.toString());
  }
};

export default handler;
