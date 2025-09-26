const Replicate = require("replicate");
const tus = require("tus-js-client");
const { createClient } = require("@supabase/supabase-js");
const namer = require("color-namer");
require("dotenv").config();

const replicate = new Replicate({
  // auth: process.env.REPLICATE_API_TOKEN,
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  "https://qnlscpmwamswjhhoorwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubHNjcG13YW1zd2poaG9vcnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MDMzMSwiZXhwIjoyMDY2MzU2MzMxfQ.52UneeW6RjFP9Rf-VG0F6jX6KiGiEIX25cdr2M3xCtg",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const styleMap = {
  Cartoon: "in cartoon style",
  "3D": "3D render",
  Anime: "anime illustration",
  Pencil: "pencil sketch",
  Illustration: "digital illustration",
  Fantasy: "fantasy concept art",
};

const aspectRatioMap = {
  landscape: "16:9",
  portrait: "9:16",
  square: "1:1",
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
const uploadFile = async (bucketName, fileName, imageBuffer, contentType = "image/jpeg") => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType: contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

const imageGeneration = async (req, res) => {
  try {
    const { prompt, size, quantity = 1 } = req.body;

    // Handle style - could be JSON string or plain string
    if (typeof req.body.style === 'string') {
      try {
        style = JSON.parse(req.body.style);
      } catch {
        // If parsing fails, treat as plain string
        style = { name: req.body.style };
      }
    } else {
      style = { name: "normal style" };
    }

    // Handle colors - could be JSON string or plain array
    if (typeof req.body.colors === 'string') {
      try {
        colors = JSON.parse(req.body.colors);
      } catch {
        colors = [];
      }
    } else {
      colors = req.body.colors || [];
    }
    const uploadedFile = req.file;

    // console.log("Received data:", {
    //   prompt,
    //   style,
    //   size,
    //   colors,
    //   quantity,
    //   hasFile: !!uploadedFile
    // });

    // Validate required fields
    if (!prompt || !style || !size || !Array.isArray(colors)) {
      // console.log("Validation failed:", {
      //   hasPrompt: !!prompt,
      //   hasStyle: !!style,
      //   hasSize: !!size,
      //   colorsIsArray: Array.isArray(colors)
      // });
      return res.status(400).json({
        error: "Invalid input data",
        details: {
          prompt: !prompt ? "Missing prompt" : "OK",
          style: !style ? "Missing style" : "OK",
          size: !size ? "Missing size" : "OK",
          colors: !Array.isArray(colors) ? "Colors must be an array" : "OK"
        }
      });
    }


    const imageCount = Math.min(Math.max(parseInt(quantity), 1), 4);
    // Get uploaded file from multer (same pattern as video generation)

    // Upload file to Supabase and get URL
    let imagePromptUrl = null;
    if (uploadedFile) {
      // console.log("Uploading file to Supabase...");

      const imageFileName = `image-prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${uploadedFile.originalname.split('.').pop()}`;
      const bucketName = "allmyai-content";

      imagePromptUrl = await uploadFile(bucketName, imageFileName, uploadedFile.buffer, uploadedFile.mimetype);
      // console.log("✅ Image uploaded to Supabase:", imagePromptUrl);
    }




    // Build final prompt 
    const colorNames = colors.map((hex) => {
      const result = namer(hex);
      return result.basic[0].name;
    });

    const styleText = styleMap[style.name] || "";
    const colorText =
      colors.length == 0 || colors == ""
        ? ""
        : `with colors like ${colorNames.join(", ")}`;
    const fullPrompt = `${prompt}, ${styleText}, ${colorText}`;

    const input = {
      prompt: fullPrompt,
      aspect_ratio: aspectRatioMap[size] || "1:1",
      prompt_upsampling: true,
      safety_tolerance: 2,
      output_format: "webp",
      output_quality: 80,
    };




    // Add image URL to input
    if (imagePromptUrl) {
      input.image_prompt = imagePromptUrl;
      // console.log("✅ Image URL added to generation input");
    }

    // console.log("Image Prompt URL: ", imagePromptUrl)

    // console.log(`Generating ${imageCount} images in parallel...`);

    // Create array of generation promises
    const generationPromises = Array.from({ length: imageCount }, (_, i) =>
      generateAndUploadImage(input, i + 1),
    );

    // Wait for all promises to settle (success or failure)
    const results = await Promise.allSettled(generationPromises);

    // Separate successful and failed results
    const successfulImages = [];
    const failedImages = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulImages.push(result.value);
      } else {
        failedImages.push({
          index: index + 1,
          error: result.reason.message || "Unknown error",
        });
        console.error(`Image ${index + 1} failed:`, result.reason);
      }
    });

    // Determine response based on results
    if (successfulImages.length === 0) {
      return res.status(500).json({
        type: "error",
        message: "All images failed to generate",
        failedCount: failedImages.length,
        errors: failedImages,
      });
    }

    const response = {
      prompt: prompt,
      type:
        successfulImages.length === imageCount ? "success" : "partial_success",
      message: `${successfulImages.length}/${imageCount} images generated successfully`,
      requestedQuantity: imageCount,
      successfulCount: successfulImages.length,
      failedCount: failedImages.length,
      images: successfulImages,
      totalSize: successfulImages.reduce((sum, img) => sum + img.fileSize, 0),
    };

    // Include error details if some failed
    if (failedImages.length > 0) {
      response.errors = failedImages;
      response.message += `. ${failedImages.length} images failed to generate.`;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in image generation:", error);
    res.status(500).json({
      type: "error",
      message: "Failed to start image generation",
      details: error.message,
    });
  }
};

// Enhanced helper function with better error handling
const generateAndUploadImage = async (input, index) => {
  try {
    // console.log(`Starting generation for image ${index}...`);

    const outputStream = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input,
    });

    const imageBuffer = await streamToBuffer(outputStream);
    // console.log(
    //   `Image ${index} buffer created, size:`,
    //   imageBuffer.length,
    //   "bytes",
    // );

    const fileName = `generated-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}.jpg`;

    const bucketName = "allmyai-content";
    const uploadUrl = await uploadFile(bucketName, fileName, imageBuffer);

    // console.log(`Image ${index} uploaded successfully!`);

    return {
      fileName: fileName,
      imageUrl: uploadUrl,
      fileSize: imageBuffer.length,
      index: index,
      status: "success",
    };
  } catch (error) {
    console.error(`Error generating image ${index}:`, error);
    throw new Error(`Image ${index} generation failed: ${error.message}`);
  }
};

module.exports = imageGeneration;
