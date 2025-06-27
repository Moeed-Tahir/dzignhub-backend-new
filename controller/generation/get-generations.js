const Generation = require("../../models/Generation");

const asyncWrapper = require("../../middleware/async")
const getGenerations = asyncWrapper(async (req, res) => {

    try {
        const generations = await Generation.find({});

        res.status(200).json({ type: "success", message: "Generation fetched successfully", generations: generations });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ type: "error", message: "Something went wrong" });

    }


})
module.exports = getGenerations;