const { writeFile } = require("fs/promises");
const Replicate = require("replicate");

const replicate = new Replicate();

const imageGeneration = async (req, res) => {
    try {
        console.log(process.env.REPLICATE_API_TOKEN);
        const input = {
            prompt: "black forest gateau cake spelling out the words \"FLUX 1 . 1 Pro\", tasty, food photography",
            prompt_upsampling: true
        };

        const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });
        await writeFile("output.jpg", output);
        
        res.status(200).json({ message: "Image generated successfully", filePath: "output.jpg" });
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: "Failed to generate image" });
    }
}

module.exports = imageGeneration;