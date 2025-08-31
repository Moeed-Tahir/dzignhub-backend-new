const Generation = require("../../models/Generation");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const getGenerations = asyncWrapper(async (req, res) => {

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token', type: 'error' });
        }



        const generations = await Generation.find({ user: decoded.userId, type: req.body.type });

        res.status(200).json({ type: "success", message: "Generation fetched successfully", generations: generations });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ type: "error", message: "Something went wrong" });

    }


})
module.exports = getGenerations;