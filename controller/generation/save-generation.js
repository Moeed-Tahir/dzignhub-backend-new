const Generation = require("../../models/Generation");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

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
                // Extract just the URL string from the image object
                const imageUrl = typeof images[i] === 'object'
                    ? (images[i].imageUrl || images[i].videoUrl || images[i].url)
                    : images[i];

                const newGeneration = new Generation({
                    user: decoded.userId,
                    prompt: req.body.prompt,
                    type: req.body.type,
                    url: imageUrl, // Save just the URL string
                    size: images[i].fileSize || req.body.size
                });
                await newGeneration.save();
            }
            return res.status(200).json({ type: "success", message: "Generations saved successfully" });
        }

        // For single image generation
        // Extract just the URL string from the response
        let imageUrl;
        if (typeof req.body.url === 'object') {
            // If url is an object, extract the URL property
            imageUrl = req.body.url.imageUrl || req.body.url.videoUrl || req.body.url.url;
        } else {
            // If url is already a string, use it directly
            imageUrl = req.body.url || req.body.imageUrl;
        }

        const newGeneration = new Generation({
            user: decoded.userId,
            prompt: req.body.prompt,
            type: req.body.type,
            url: imageUrl, // Save just the URL string
            size: req.body.fileSize || req.body.size
        });

        await newGeneration.save();

        res.status(200).json({ type: "success", message: "Generation saved successfully" });
    } catch (error) {
        console.log("Error saving generation:", error);
        res.status(500).json({
            type: "error",
            message: "Something went wrong",
            error: error.message
        });
    }
});

module.exports = saveGeneration;