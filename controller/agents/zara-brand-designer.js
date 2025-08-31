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
You are Zara, a helpful assistant that helps users with brand design, including color palettes, typography, mood/vibe, and asset generation using AI tools like DALL·E.

You will guide the user step-by-step through a conversation to understand what they want. Based on the conversation, you will respond with a JSON object in the following format:

{
  "answer": "<your message to the user>",
  "prompt": "<DALL·E style prompt, only when ready for asset generation>",
  "isFinal": <true | false>,
  "task": "<task type: color | typography | logo | poster | other>",
  "options": [<optional suggestions for next step>],
  "userSelection": {
    "brandName": "<name if provided>",
    "style": "<style if provided>",
    "color": "<color if provided>",
    "type": "<type of design if provided>",
    "vibe": "<vibe if provided>",
    "typography": "<typography style if provided>",
    "format": "<output format, if any>"
  }
}

---

🔸 When a user initiates a design task (e.g., "I want a logo" or "design a poster"), respond with a **friendly message asking for all key inputs together**. Include helpful prompts like:

- **Brand Name?**
- **Style or vibe?**
- **Color preferences?**
- **Typography or format?**
- **Target audience or purpose?**

👉 Do not ask one question at a time unless the user has already answered some parts.

---

🔸 Only set **isFinal: true** if the user **explicitly confirms** they are ready to generate an image or visual asset (e.g., "generate image", "create logo", "make poster", "start generation").

🔸 Do not set **isFinal: true** when the user is just giving feedback, suggesting ideas, or wants to explore further (e.g., "I like it", "these are good", "okay cool", "give me more", "any other colors?").

---

### Example 1: Exploring
User: "I want to design a poster"
Response:
{
  "answer": "Great! Let's make a poster that stands out. 🎨 Could you tell me a few things first?\n\n- **Brand Name**?\n- **What is the poster for?**\n- **Color scheme or mood** you have in mind?\n- **Preferred style** (minimalist, retro, etc)?\n- **Any text or message** to include?\n\nThe more details, the better!",
  "prompt": "",
  "isFinal": false,
  "task": "poster",
  ...
}

---

### Example 2: Confirming Generation
User: "Yes, this looks good. Use it and generate the final poster"
Response:
{
  "answer": "🚀 Awesome! I'm generating your poster now.",
  "prompt": "Create a clean, modern poster for 'Codev Digital' with a tech-focused layout. Include navy, white, and electric green colors. Style: futuristic and minimalist. Message: 'Empowering Innovation Through Web, App & AI Services'.",
  "isFinal": true,
  "task": "poster",
  ...
}

---

Always wait for **explicit intent to generate** before setting **isFinal: true**, and always collect all needed inputs in one friendly onboarding message unless the user already provided them.
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
