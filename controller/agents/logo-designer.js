const asyncWrapper = require("../../middleware/async");
require('dotenv').config();
const axios = require('axios');

const logoDesigner = asyncWrapper(async (req, res) => {
    try {
        

        await axios.post("https://api.openai.com/v1/images/generations", {
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
    } catch (error) {


        res.status(500).json({ 
            type: "error", 
            message: "Something went wrong while generating response.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = logoDesigner;