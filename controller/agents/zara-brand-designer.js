const asyncWrapper = require("../../middleware/async");
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment variables
});

const zaraBrandDesigner = asyncWrapper(async (req, res) => {
    try {
console.log(`API KEY: ${process.env.OPENAI_API_KEY}`); 
        const { message, context, previousMessages } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({ 
                type: "error", 
                message: "Message is required" 
            });
        }

        // Build the conversation context
        const systemPrompt = `You are Zara, an expert brand designer and creative strategist.
Your role is to understand the user's vision for their brand by asking a series of thoughtful questions — one at a time — and guide them through building a brand identity.
You specialize in:
- Brand identity development
- Logo design and visual branding
- Color psychology and mood-based branding
- Typography and style guidance
- Brand voice and storytelling
- Market positioning
- Brand assets and guideline generation

Your behavior:
- Ask one question at a time to gather branding preferences.
- Wait for user input before proceeding.
- Provide clear and JSON formatted responses.

Each response should only include valid JSON format, not text. After each user response, return a structured JSON object in the following format:

{
  "answer": "Your explanation or comment based on the user's input or your current question",
  "prompt": "", // Leave empty until isFinal is true and you have a complete prompt
  "isFinal": false, // true only when you're ready to generate the final logo/branding
  "userSelection": {
    "color": "", // Fill progressively
    "iconText": "",
    "style": ""
  }
}
Once you've collected all necessary info (style, logo type, color, etc.), return a final JSON like this:
{
  "answer": "Great! We're ready to create your brand visuals.",
  "prompt": "Generate a minimal bold logo in black and white colors with the word 'XYZO' in modern sans serif. Include icon + text layout.",
  "isFinal": true,
  "userSelection": {
    "color": "Black/White",
    "iconText": "XYZO",
    "style": "Minimal"
  }
}
🧠 Your flow should look like this (example questions):

“🎨 What style best represents your brand?”
Options: Elegant, Bold, Minimal, Playful, Futuristic, Classic, Handcrafted

“👇🏻What type of logo are you looking for?”
Options: Wordmark (text only), Icon + Text (combined), Symbol (icon only)

“🎨 What color mood do you want your brand to reflect?”
Options: Blue, Red, Black/White, Earth tones, Pastels, Vibrant Multicolor

“✍🏻 What text or name should appear in the logo?”

“✨ What message or vibe should your brand give off?”
(Optional open-ended question — helps enhance final prompt)

Finally, summarize the choices and return a prompt to generate branding visuals.


        ${context ? `Additional context: ${context}` : ''}`;

        // Build messages array
        const messages = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        // Add previous conversation if provided
        if (previousMessages && Array.isArray(previousMessages)) {
            messages.push(...previousMessages);
        }

        // Add current user message
        messages.push({
            role: "user",
            content: message
        });

        console.log('🤖 Sending request to OpenAI...');

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k", // or "gpt-3.5-turbo" for faster/cheaper responses
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7, // Adjust creativity level (0-1)
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const aiResponse = completion.choices[0].message.content;

        console.log('✅ OpenAI response received');

        res.status(200).json({ 
            type: "success", 
            message: "Response generated successfully",
            data: {
                response: aiResponse,
                usage: completion.usage,
                model: completion.model
            }
        });

    } catch (error) {
        console.error('❌ OpenAI API Error:', error);

        // Handle different types of errors
        if (error.error?.type === 'insufficient_quota') {
            return res.status(402).json({ 
                type: "error", 
                message: "API quota exceeded. Please check your OpenAI billing." 
            });
        }

        if (error.error?.type === 'invalid_api_key') {
            return res.status(401).json({ 
                type: "error", 
                message: "Invalid OpenAI API key." 
            });
        }

        if (error.error?.type === 'rate_limit_exceeded') {
            return res.status(429).json({ 
                type: "error", 
                message: "Rate limit exceeded. Please try again later." 
            });
        }

        res.status(500).json({ 
            type: "error", 
            message: "Something went wrong while generating response.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = zaraBrandDesigner;