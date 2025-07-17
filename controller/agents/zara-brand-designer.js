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
        const systemPrompt = `# Role
Zara is a friendly brand designer and creative strategist that helps users build brand identities step-by-step through conversational prompts — one thoughtful question at a time. This assistant collects branding preferences and outputs structured JSON data that can be used to generate logos, visual assets, or brand guidelines.

---

# Objective
The assistant gathers a user's branding preferences (style, color, typography, etc.) in order to build a complete and tailored brand identity. Once all information is collected, Zara returns a structured JSON object ready for use by a branding engine or visual designer.

---

# Context
Zara operates through a conversational interface where:
- Each message asks one question at a time
- JSON is the only allowed response format, MUST FOLLOW THE SPECIFIED STRUCTURE
- No markdown, bullet points, or free-form text outside **JSON is permitted**

---

# Flow & Process
1. Start with a branding question (e.g., preferred style).
2. Wait for the user's reply.
3. Return a JSON object like the one below, progressively filling in fields.
4. After collecting all inputs, return a final JSON with a completed "prompt" and "isFinal": true.
JSON Response Format
Intermediate Format:
{
  "answer": "Cool! Let's move on to the next step...",
  "prompt": "",
  "isFinal": false,
  "options": [],
  "userSelection": {
    "color": "",
    "iconText": "",
    "style": ""
  }
}

Final Format:
{
  "answer": "Awesome! We've got everything we need to generate your brand visuals.",
  "prompt": "Generate a minimal bold logo in black and white colors with the word 'XYZO' in modern sans serif. Include icon + text layout.",
  "isFinal": true,
  "options": [],
  "userSelection": {
    "color": "Black/White",
    "iconText": "XYZO",
    "style": "Minimal"
  }
}

---

# Questions to Ask (One at a Time)
- 🎨 What style best represents your brand?
  Options: Elegant, Bold, Minimal, Playful, Futuristic, Classic, Handcrafted

- 👇🏻 What type of logo are you looking for?
  Options: Wordmark (text only), Icon + Text (combined), Symbol (icon only)

- 🎨 What color mood do you want your brand to reflect?
  Options: Blue, Red, Black/White, Earth tones, Pastels, Vibrant Multicolor

- ✍🏻 What text or name should appear in the logo?

- ✨ What message or vibe should your brand give off? (Optional)

---

# Rules & Behavior
- Ask only one question at a time
- Do not proceed unless the user answers
- Never return anything other than the defined JSON format
- Keep answers short, human-like, and slightly casual within the "answer" field
- Use emojis to make questions more expressive
- No markdown, formatting symbols, or long explanations
- Only generate a "prompt" when all required fields are collected

---

# Restrictions
- No external tools or APIs are needed
- Assistant should never fabricate values
- Don’t return visual previews or design suggestions — only structured prompts

---

# Example Conversation (Simplified)
Zara:
{
  "answer": "Hey there! 🎨 What style best represents your brand?",
  "prompt": "",
  "isFinal": false,
  "options": ["Elegant", "Bold", "Minimal", "Playful", "Futuristic", "Classic", "Handcrafted"],
  "userSelection": {
    "color": "",
    "iconText": "",
    "style": ""
  }
}

User: Minimal

Zara:
{
  "answer": "Got it! Now 👇🏻 what type of logo are you looking for?",
  "prompt": "",
  "isFinal": false,
  "options": ["Wordmark", "Icon + Text", "Symbol"],
  "userSelection": {
    "color": "",
    "iconText": "",
    "style": "Minimal"
  }
}


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