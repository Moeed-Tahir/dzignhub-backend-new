const Replicate = require("replicate");
env = require("dotenv").config();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
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
    "Golden hour": "cinematic style with warm golden lighting, like during sunset",
    "Candle lit": "soft candle-lit ambiance with warm, flickering shadows",
    "Chiaroscuro": "dramatic chiaroscuro lighting with strong contrast between light and dark",
    "Film haze": "dreamy film haze effect with vintage tones and subtle grain",
    "Midnight": "dark atmospheric style with cool tones and night-time mood",
    "Light": "bright minimal style with soft natural lighting and airy feel"
};

const sizeMap = {
    // "square": "1:1",
    "landscape": "16:9",
    "portrait": "9:16",
    // "ultrawide": "21:9"
};

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

// Upload file (image or video) to Supabase
const uploadFile = async (bucketName, fileName, fileBuffer, contentType) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
                contentType: contentType,
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

// Process uploaded image file to get URL
const processImageFile = async (file, bucketName, prefix) => {
    if (!file) return null;

    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const fileBuffer = file.buffer || await streamToBuffer(file);

    return await uploadFile(bucketName, fileName, fileBuffer, 'image/jpeg');
};

const videoGeneration = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        const { prompt, style, duration, size } = req.body;
        const startImageFile = req.files?.startImage?.[0];
        const endImageFile = req.files?.endImage?.[0];

        console.log("Received values:");
        console.log("- prompt:", prompt);
        console.log("- style:", style);
        console.log("- duration:", duration, typeof duration);
        console.log("- size:", size);

        // Validation
        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!styleMap[style]) {
            return res.status(400).json({
                error: "Valid style is required",
                receivedStyle: style,
                availableStyles: Object.keys(styleMap)
            });
        }

        if (!duration) {
            return res.status(400).json({ error: "Duration is required" });
        }

        // Fix duration parsing for "4 sec" format
        let convertedDuration;
        if (typeof duration === 'string') {
            // Handle "4 sec", "4 seconds", "4" formats
            const match = duration.match(/(\d+)/);
            if (match) {
                convertedDuration = parseInt(match[1]);
            } else {
                return res.status(400).json({
                    error: "Invalid duration format",
                    receivedDuration: duration
                });
            }
        } else {
            convertedDuration = parseInt(duration);
        }

        console.log("Converted duration:", convertedDuration);

        if (isNaN(convertedDuration) || convertedDuration < 1 || convertedDuration > 10) {
            return res.status(400).json({
                error: "Duration must be between 1-10 seconds",
                receivedDuration: duration,
                convertedDuration: convertedDuration
            });
        }

        if (!size || !sizeMap[size]) {
            return res.status(400).json({
                error: "Valid size is required",
                receivedSize: size,
                availableSizes: Object.keys(sizeMap)
            });
        }

        console.log("Processing video generation request...");
        console.log("Prompt:", prompt);
        console.log("Style:", style);
        console.log("Duration:", convertedDuration);
        console.log("Size:", size);

        const bucketName = 'allmyai-content';

        // Upload start and end images if provided
        let startImageUrl = null;
        let endImageUrl = null;

        if (startImageFile) {
            console.log("Uploading start image...");
            startImageUrl = await processImageFile(startImageFile, bucketName, 'start-image');
            console.log("Start image uploaded:", startImageUrl);
        }

        if (endImageFile) {
            console.log("Uploading end image...");
            endImageUrl = await processImageFile(endImageFile, bucketName, 'end-image');
            console.log("End image uploaded:", endImageUrl);
        }

        // Build enhanced prompt with style
        const styleText = styleMap[style];
        const enhancedPrompt = `${prompt}, ${styleText}`;

        // Prepare input for Kling model
        const input = {
            prompt: enhancedPrompt,
            aspect_ratio: sizeMap[size],
            duration: convertedDuration, // Use the parsed integer
            creativity: 0.7,
            camera_control: "auto"
        };

        // Add image inputs if provided
        if (startImageUrl) {
            input.start_image = startImageUrl;
        }

        if (endImageUrl) {
            input.end_image = endImageUrl;
        }

        console.log("Kling input:", JSON.stringify(input, null, 2));
        console.log("Starting video generation with Kling...");

        // Generate video with Kling
        const outputStream = await replicate.run("wan-video/wan-2.2-t2v-fast", { input });

        // Convert stream to buffer
        console.log("Converting video stream to buffer...");
        const videoBuffer = await streamToBuffer(outputStream);
        console.log("Video buffer created, size:", videoBuffer.length, "bytes");

        // Upload generated video to Supabase
        const videoFileName = `generated-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
        console.log("Uploading video to Supabase...");

        const videoUrl = await uploadFile(bucketName, videoFileName, videoBuffer, 'video/mp4');

        console.log("Video uploaded successfully!");

        console.log("Video URL: ", videoUrl);

        const response = {
            type: "success",
            message: "Video generated successfully",
            video: {
                fileName: videoFileName,
                videoUrl: videoUrl,
                fileSize: videoBuffer.length,
                duration: convertedDuration, // Return the parsed duration
                style: style,
                size: size,
                prompt: prompt,
                startImageUrl: startImageUrl,
                endImageUrl: endImageUrl
            }
        };
        console.log("sending response: ", response);

        res.status(200).json(response);
    } catch (error) {
        console.error("Error in video generation:", error);
        res.status(500).json({
            type: "error",
            message: "Failed to generate video",
            details: error.message
        });
    }
};

module.exports = videoGeneration;