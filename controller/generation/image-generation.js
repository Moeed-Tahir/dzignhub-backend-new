
const Replicate = require("replicate");
const tus = require('tus-js-client');
const { createClient } = require('@supabase/supabase-js');
const namer = require("color-namer");
const replicate = new Replicate({
    auth: "r8_DH1mDmgtXLaA1YiEaszqWCYHFOxrR9e2XFeKy"
});

const supabase = createClient(
    "https://qnlscpmwamswjhhoorwt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubHNjcG13YW1zd2poaG9vcnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MDMzMSwiZXhwIjoyMDY2MzU2MzMxfQ.52UneeW6RjFP9Rf-VG0F6jX6KiGiEIX25cdr2M3xCtg",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const styleMap = {
    cartoon: "in cartoon style",
    "3d": "3D render",
    anime: "anime illustration",
    pencil: "pencil sketch",
    illustration: "digital illustration",
    fantasy: "fantasy concept art"
};

const aspectRatioMap = {
    landscape: "16:9",
    portrait: "9:16",
    square: "1:1"
};


const projectId = "qnlscpmwamswjhhoorwt";

async function streamToBuffer(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return Buffer.concat(chunks);
}

// Simplified upload function using Supabase client directly
const uploadFile = async (bucketName, fileName, imageBuffer) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
};


const imageGeneration = async (req, res) => {
    try {

        const { prompt, style, size, colors } = req.body;

        if (!prompt || !style || !size || !Array.isArray(colors) || colors.length !== 3) {
            return res.status(400).json({ error: "Invalid input data" });
        }

        // Convert hex to color names
        const colorNames = colors.map(hex => {
            const result = namer(hex);
            return result.basic[0].name; // Get the closest basic color name
        });

        // Build final prompt
        const styleText = styleMap[style] || "";
        const colorText = `with colors like ${colorNames.join(", ")}`;
        const fullPrompt = `${prompt}, ${styleText}, ${colorText}`;

        // Construct input for Flux model
        const input = {
            prompt: fullPrompt,
            aspect_ratio: aspectRatioMap[size] || "1:1",
            prompt_upsampling: true,
            safety_tolerance: 2,
            output_format: "webp",
            output_quality: 80
        };

        const outputStream = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

        console.log("Received ReadableStream from Replicate");

        // Convert stream to buffer using your existing function
        console.log("Converting stream to buffer...");
        const imageBuffer = await streamToBuffer(outputStream);
        console.log("Image buffer created, size:", imageBuffer.length, "bytes");

        // Generate unique filename
        const fileName = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;


        // Upload to Supabase
        const bucketName = 'allmyai-content';
        console.log("Starting upload to Supabase...");

        const uploadUrl = await uploadFile(bucketName, fileName, imageBuffer);

        console.log("Upload completed successfully!");

        res.status(200).json({
            message: "File uploaded successfully to Supabase",
            fileName: fileName,
            uploadUrl: uploadUrl,
            fileSize: imageBuffer.length
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file", details: error.message });
    }
}
module.exports = imageGeneration;