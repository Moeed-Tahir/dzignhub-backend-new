const asyncWrapper = require("../../middleware/async");
require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
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

// Function to download image from URL and convert to buffer
const downloadImageAsBuffer = async (imageUrl) => {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error downloading image:', error);
        throw new Error('Failed to download image from OpenAI');
    }
};

// Function to upload image buffer to Supabase
const uploadToSupabase = async (bucketName, fileName, imageBuffer) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBuffer, {
                contentType: 'image/png',
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
        console.error("Supabase upload error:", error);
        throw error;
    }
};

const logoDesigner = asyncWrapper(async (req, res) => {
    try {
        console.log('🎨 Logo Designer API called with prompt:', req.body.prompt);

        // Generate logo with OpenAI DALL-E
        const response = await axios.post("https://api.openai.com/v1/images/generations", {
            model: "dall-e-3",
            prompt: req.body.prompt,
            n: 1,
            size: req.body.size || "1024x1024",
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const originalImageUrl = response.data.data[0].url;
        console.log('✅ Logo generated successfully from OpenAI');

        // Download the image as buffer
        console.log('📥 Downloading image from OpenAI...');
        const imageBuffer = await downloadImageAsBuffer(originalImageUrl);
        console.log('✅ Image downloaded, size:', imageBuffer.length, 'bytes');

        // Generate unique filename
        const fileName = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        
        // Upload to Supabase
        console.log('☁️ Uploading to Supabase...');
        const bucketName = 'allmyai-content';
        const supabaseImageUrl = await uploadToSupabase(bucketName, fileName, imageBuffer);
        console.log('✅ Logo uploaded to Supabase successfully!');

        res.status(200).json({ 
            type: "success", 
            message: "Logo generated and saved successfully",
            data: {
                imageUrl: supabaseImageUrl, // Return Supabase URL instead of OpenAI URL
                originalUrl: originalImageUrl, // Keep original URL for reference
                fileName: fileName,
                fileSize: imageBuffer.length,
                prompt: req.body.prompt
            }
        });

    } catch (error) {
        console.error('❌ Logo generation error:', error);

        // Handle different types of errors
        if (error.response?.data?.error) {
            const openAIError = error.response.data.error;
            
            if (openAIError.code === 'billing_hard_limit_reached') {
                return res.status(402).json({ 
                    type: "error", 
                    message: "OpenAI API quota exceeded. Please check your billing." 
                });
            }
            
            if (openAIError.code === 'invalid_api_key') {
                return res.status(401).json({ 
                    type: "error", 
                    message: "Invalid OpenAI API key." 
                });
            }
            
            if (openAIError.code === 'rate_limit_exceeded') {
                return res.status(429).json({ 
                    type: "error", 
                    message: "Rate limit exceeded. Please try again later." 
                });
            }
        }

        // Handle download/upload errors
        if (error.message.includes('download') || error.message.includes('upload')) {
            return res.status(500).json({ 
                type: "error", 
                message: "Logo generated but failed to save. Please try again." 
            });
        }

        res.status(500).json({ 
            type: "error", 
            message: "Something went wrong while generating logo.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = logoDesigner;