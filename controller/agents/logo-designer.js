const asyncWrapper = require("../../middleware/async");
require('dotenv').config();
const axios = require('axios');

const logoDesigner = asyncWrapper(async (req, res) => {
    try {
        console.log('🎨 Logo Designer API called with prompt:', req.body.prompt);

        const response = await axios.post("https://api.openai.com/v1/images/generations", {
          model: "dall-e-3",
          prompt: req.body.prompt,
          n: 1,
          size: "1024x1024"
        }, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const imageUrl = response.data.data[0].url;

        console.log('✅ Logo generated successfully');

        // save image to 

        res.status(200).json({ 
            type: "success", 
            message: "Logo generated successfully",
            data: {
                imageUrl: imageUrl,
                prompt: req.body.prompt
            }
        });

    } catch (error) {
        console.error('❌ Logo generation error:', error);

        res.status(500).json({ 
            type: "error", 
            message: "Something went wrong while generating logo.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = logoDesigner;