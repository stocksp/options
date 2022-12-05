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
    console.log("result", JSON.stringify(result));
    let newData = [...data];
    newData.forEach((obj) => {
      // first find a result in our array of results
      // it will be an object
      const foundResult = result.find((r) => r.underlyingSymbol === obj.name);
      if (foundResult) {
        // check if the objects expirationDate is what we are looking for
        const foundExpireDate =
          foundResult.options[0].expirationDate
            .toISOString()
            .substring(0, 10) === obj.date;
        if (foundExpireDate) {
          const theType = obj.type == "call" ? "calls" : "puts";
          const foundOption = foundResult.options[0][theType].find(
            (o) => o.strike == obj.strike
          );
          if (foundOption) {
            obj.price = foundOption.lastPrice;
            obj.parentPrice = foundResult.quote.regularMarketPrice;
          } else {
            console.log("didn't find option");
            obj.price = -1;
          }
        } else {
          console.log("didn't find foundExpireDate");
          obj.price = -1;
        }
      } else {
        console.log("didn't find result");
        obj.price = -1;
      }
    });

    res.json(newData);
  } catch (error) {
    console.log("error thrown in getOptions", error);
    res.json("Error: " + error.toString());
  }
};

export default handler;
