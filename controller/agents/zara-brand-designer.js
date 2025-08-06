const asyncWrapper = require("../../middleware/async");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment variables
});

const zaraBrandDesigner = asyncWrapper(async (req, res) => {
  try {
    console.log(`API KEY: ${process.env.OPENAI_API_KEY}`);
    console.log("Received request for Zara Brand Designer");
    const { message, context, previousMessages } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({
        type: "error",
        message: "Message is required",
      });
    }

    // Build the conversation context
    const systemPrompt = `
    You are Zara, a helpful, friendly, and creative brand design assistant.
    
    Always respond ONLY in the following JSON format:
    
    {
      "answer": "string",       // Friendly response with Markdown (optional) to ask next step or confirm generation
      "prompt": "string",       // Prompt to send to DALL·E (used internally, not shown to user)
      "isFinal": boolean,       // true only when asset is ready to generate
      "task": "logo" | "poster" | "color" | "guide" | "typography",
      "options": [],
      "userSelection": {
        "brandName": "",
        "style": "",
        "color": "",
        "type": "",
        "vibe": "",
        "typography": "",
        "format": ""
      }
    }
    
    ---
    
    ### Guidelines
    
    - Always respond in **valid JSON** only. Never include extra text outside of the JSON block.
    - Inside the "answer" field, use **friendly, human-like language** with basic Markdown (like **bold**, bullet points, line breaks, emojis).
    - Ask multiple questions at once when needed — just like a real designer would.
    - Never repeat questions already answered.
    - If the user provides all required info AND says something like “generate”, “create”, “make”, “design”, set **"isFinal": true**.
    - When "isFinal" is true:
      - The "prompt" should describe the final design for internal use (e.g., to send to DALL·E).
      - The "answer" should **not mention prompts, AI tools, or DALL·E.**
      - Instead, say things like: "Great! I’m ready to generate your logo now 🎨" or "Perfect — let’s create your design!"
    - If the user asks anything unrelated to branding (e.g., code, travel, math), politely respond: “Sorry, I can only help with brand design tasks like logos, colors, or posters.”
    
    ---
    
    ### Example: If the user says “Design a logo for a fashion brand”
    
    Return:
    
    {
      "answer": "Sure! 👗 To design a logo for your fashion brand, I just need a few quick details:\n\n- **Brand Name**?\n- **Style or Vibe** (e.g., minimalist, luxury, streetwear)?\n- **Target Audience** (e.g., men, women, unisex)?\n- **Color Preferences** (if any)?\n- **Logo Type** (icon, text, or both)?\n- **Tagline** (optional)?\n\nOnce I have these, I’ll start designing your logo!",
      "prompt": "",
      "isFinal": false,
      "task": "logo",
      "options": [],
      "userSelection": {
        "brandName": "",
        "style": "",
        "color": "",
        "type": "",
        "vibe": "",
        "typography": "",
        "format": ""
      }
    }
    `;
    
    
    // Build messages array
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add previous conversation if provided
    if (previousMessages && Array.isArray(previousMessages)) {
      messages.push(...previousMessages);
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    console.log("🤖 Sending request to OpenAI...");

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // or gpt-4-0125-preview
      messages: messages,
      response_format: {
        type: "json_object"
      }, 
      temperature: 0.9,
      top_p: 1,
      max_tokens: 1000,
    });
    

    const aiResponse = completion.choices[0].message.content;

    console.log("✅ OpenAI response received");

    res.status(200).json({
      type: "success",
      message: "Response generated successfully",
      data: {
        response: aiResponse,
        usage: completion.usage,
        model: completion.model,
      },
    });
  } catch (error) {
    console.error("❌ OpenAI API Error:", error);

    // Handle different types of errors
    if (error.error?.type === "insufficient_quota") {
      return res.status(402).json({
        type: "error",
        message: "API quota exceeded. Please check your OpenAI billing.",
      });
    }

    if (error.error?.type === "invalid_api_key") {
      return res.status(401).json({
        type: "error",
        message: "Invalid OpenAI API key.",
      });
    }

    if (error.error?.type === "rate_limit_exceeded") {
      return res.status(429).json({
        type: "error",
        message: "Rate limit exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      type: "error",
      message: "Something went wrong while generating response.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = zaraBrandDesigner;
