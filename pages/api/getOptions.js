import yahooFinance from "yahoo-finance2";
const handler = async (req, res) => {
    const name = req.query.name;
    const date = req.query.optionDate;
    const optionsType = req.query.optionsType;
    console.log("starting getOptions:", name, date, optionsType);
    try {
        const queryOptions = {
            lang: "en-US",
            formatted: false,
            region: "US",
            date,
        };
        const result = await yahooFinance.options(name, queryOptions);
        const callOrPuts = result.options[0][optionsType];
        const theData = callOrPuts.map(d => {
            return {
                "contractSymbol": d.contractSymbol,
                "strike": d.strike,
                "lastPrice": d.lastPrice,
            }
        });
        const data = {
            name: req.query.name,
            date: req.query.optionDate,
            optionsType: req.query.optionsType,
            data: theData,

        };
        res.json(data);
    } catch (error) {
        console.log("error thrown in getOptions", error);
        res.json("Error: " + error.toString());
    }
};

export default handler;
