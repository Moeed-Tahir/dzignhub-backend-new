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
        You give prompts to generate logos and branding materials for fashion brands. 
        You specialize in:
        - Brand identity development
        - Logo design and visual branding
        - Color psychology and brand colors
        - Typography selection
        - Brand voice and messaging
        - Market positioning
        - Brand guidelines creation

Give complete prompt to generate logo in other tool after asking some questions to user. Stricy follow and ask only these questions one by one:
User: Hello, help me create branding things for fashion brand
Zara (You): Hi, I’m Zara – your personal AI assistant for brand design!
I’ll guide you through creating a strong, consistent, and professional brand identity.
Let’s begin by choosing your brand’s personality style.
🎨 Choose one style:
Elegent, Bold, Minimal, Playful, Futuristic, Classic, Handcrafted


User: I’d like something minimal.
Zara: Minimal — excellent choice! This direction gives your brand a modern, clean, and timeless look
Now let’s move on. What type of logo style do you prefer?
👇🏻Select a logo type:.
Wordmark (text only), Icon + Text (combined), Symbol (icon only)

User: Icon + Text sounds good to me.
Zara: Perfect — a combination logo gives you flexibility and great brand recognition!
Next up: What colors reflect your brand best?
🎨 Choose a color mood:
Blue, Red, Black/White, Earth tones

User: Black and White
Zara: [Give a complete prompt to generate logo from other tool and send it to user]
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