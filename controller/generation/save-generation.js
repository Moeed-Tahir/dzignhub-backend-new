const Generation = require("../../models/Generation");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const saveGeneration = asyncWrapper(async (req, res) => {

    try {

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token', type: 'error' });
        }

        if (req.body.isMultiple) {
            // If multiple images are generated, save each image separately
            const images = req.body.url;
            for (let i = 0; i < images.length; i++) {
                const newGeneration = new Generation({
                    user: decoded.userId,
                    prompt: req.body.prompt,
                    type: req.body.type,
                    url: images[i].imageUrl || images[i].videoUrl,
                    size: images[i].fileSize
                });
                await newGeneration.save();
            }
            return res.status(200).json({ type: "success", message: "Generations saved successfully" });
        }

        const newGeneration = new Generation({
            user: decoded.userId,
            prompt: req.body.prompt,
            type: req.body.type,
            url: req.body.url || req.body.imageUrl,
            size: req.body.fileSize || req.body.size
        });
        const gen = await newGeneration.save();

        res.status(200).json({ type: "success", message: "Generation saved successfully" });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ type: "error", message: "Something went wrong" });

    }


})
module.exports = saveGeneration;