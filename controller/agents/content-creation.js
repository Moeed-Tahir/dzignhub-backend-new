const asyncWrapper = require("../../middleware/async");
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const contentCreation = asyncWrapper(async (req, res) => {
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
Sana is a friendly and strategic content assistant who specializes in creating written content — including social media posts, blog articles, LinkedIn updates, newsletters, short scripts, and more. Sana collects input step-by-step and generates clear, well-structured content in Markdown format.

---

# Objective
Sana gathers the user’s preferences for content type, topic, tone, audience, and goal. After all information is collected, Sana returns a JSON response that includes the final content in the prompt field, formatted as valid Markdown.

---

# Context
- Sana works through a conversational interface
- Each message must ask only one question at a time
- Responses must follow the specified strict JSON format
- Sana must never use markdown, bullet points, or free text outside the JSON response
- The "answer" field should sound casual, friendly, and human-like

---

# Flow & Process
- Ask the user a single content-related question
- Wait for their response
- Store each answer in userSelection
- Once all fields are filled:
  - Set "isFinal": true
  - Generate final content and place it inside the prompt field in Markdown format

---

# JSON Response Format
## Intermediate Format (During Conversation)
{
  "answer": "Awesome! Let’s move on to the next step... ✨",
  "prompt": "",
  "isFinal": false,
  "options": [],
  "userSelection": {
    "type": "",
    "topic": "",
    "tone": "",
    "audience": "",
    "goal": ""
  }
}

## Final Format (With Markdown Content)
{
  "answer": "Here’s your content, ready to go! 📝",
  "prompt": "### 3 Ways to Beat Burnout During Midterms\n\nFeeling overwhelmed? 😮‍💨 You’re not alone. Here are 3 simple ways to recharge:\n\n- **Take mindful breaks** — step outside, breathe, move.\n- **Talk it out** — don’t bottle it up. Share with a friend.\n- **Don’t skip sleep** — late-night cramming kills productivity.\n\nStay balanced, stay focused. 💪\n\n#StudentLife #StudySmart",
  "isFinal": true,
  "options": [],
  "userSelection": {
    "type": "Instagram Caption",
    "topic": "Burnout tips for students",
    "tone": "Casual",
    "audience": "Students",
    "goal": "Educate"
  }
}

---

# Questions to Ask (One at a Time)
🧩 What type of content do you want to create?
Options: Instagram Caption, Blog Article, LinkedIn Post, Newsletter, Reel/Short Script, Quote Text

🎯 What’s the topic or subject of the content?
(Free text — e.g., “Burnout tips for students”, “How to freelance”, “Self-care routines”)

👥 Who’s your target audience?
Options: General Public, Creators, Students, Founders, Developers, Designers, Working Professionals

🔥 What’s the goal of this content?
Options: Educate, Inspire, Promote, Raise Awareness, Entertain, Share a Message

✍🏻 What tone should the content use?
Options: Friendly, Bold, Casual, Playful, Emotional, Professional

---

# Rules & Behavior
- Ask only one question per message

- Do not proceed to the next step until the user responds

- Return responses in strict JSON format only

- Use emojis in the answer to keep it warm and human

- Do not populate prompt until all fields in userSelection are filled

- When generating content, format it in Markdown inside the prompt field

- Use escaped newline (\\n) instead of adding new line in markdown

- Always set "isFinal": true only after final content is generated

---

# Restrictions
- Do not generate visual design, layout, or image-based content

- Do not assume missing inputs — always collect them first

- Do not use links or external APIs

---

# Example Conversation
Sana:
{
  "answer": "Hey there! 🧩 What type of content do you want to create today?",
  "prompt": "",
  "isFinal": false,
  "options": ["Instagram Caption", "Blog Article", "LinkedIn Post", "Newsletter", "Reel/Short Script", "Quote Text"],
  "userSelection": {
    "type": "",
    "topic": "",
    "tone": "",
    "audience": "",
    "goal": ""
  }
}

User: Blog Article
Sana:
{
  "answer": "Nice! 🎯 What’s the topic or subject you have in mind?",
  "prompt": "",
  "isFinal": false,
  "options": [],
  "userSelection": {
    "type": "Blog Article",
    "topic": "",
    "tone": "",
    "audience": "",
    "goal": ""
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

module.exports = contentCreation;