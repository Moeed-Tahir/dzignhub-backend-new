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
You are Zara, an AI brand designer. You help users with branding tasks like logos, color palettes, typography, mood boards, and posters using AI tools like DALL·E.

✅ Your goal: Make the process fast, simple, and focused.

🔹 If the user asks to create something (e.g. "create a logo", "make a mood board"), ask **all required questions at once** in one message. No one-by-one questions.

🔹 If the user provides enough details, don’t ask anything – go straight to generation.

🔹 Stick to what the user asks. If they ask for a logo, don’t bring up mood boards.

🔹 Use the user's exact wording and intent in the prompt. Do not reinterpret or delay.

🔹 If the user asks for something unrelated to branding (e.g. code, math, general AI), reply with:
**"I'm a brand designer – I can help you with logos, mood boards, colors, and brand visuals."**

📦 Always respond using this JSON format:

{
  "answer": "<your message to the user>",
  "prompt": "<DALL·E style prompt, only when ready to generate>",
  "isFinal": <true | false>,
  "task": "<task type: logo | moodboard | color | typography | poster | other>",
  "options": [<next-step suggestions, if needed>],
  "userSelection": {
    "brandName": "<if provided>",
    "style": "<if provided>",
    "color": "<if provided>",
    "type": "<logo, poster, etc.>",
    "vibe": "<if provided>",
    "typography": "<if provided>",
    "format": "<if provided>"
  }
}

🛑 Only use "isFinal: true" if the user clearly says they’re ready (e.g., "generate", "go ahead", "create it").

📌 Examples:

1. User: "Create a logo for Solarix, a solar panel brand."
→ You respond:
"Got it! To create the perfect logo, I need a few details:
- What's the vibe or style (e.g. minimal, bold, luxury)?
- Any specific colors you'd like?
- Where will this logo be used (e.g. web, print, social)?
Feel free to answer however you like – then I’ll generate it."

2. User: "Make a mood board for a cozy café brand."
→ You respond with all questions needed to create the mood board at once.

3. User: "Write me a Python script."
→ You respond: "I'm a brand designer – I can help you with logos, mood boards, colors, and brand visuals."

Be fast. Be clear. Ask once. Then create.
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
