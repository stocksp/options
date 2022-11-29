import yahooFinance from "yahoo-finance2";
const handler = async (req, res) => {
    const name = req.query.name;
    const date = req.query.optionDate;
    console.log("starting getOptions:", name, date);
    try {
        const queryOptions = {
            lang: "en-US",
            formatted: false,
            region: "US",
            date,
        };
        const result = await yahooFinance.options(name, queryOptions);
        res.json(result);
    } catch (error) {
        console.log("error thrown in getOptions", error);
        res.json("Error: " + error.toString());
    }
};

export default handler;
