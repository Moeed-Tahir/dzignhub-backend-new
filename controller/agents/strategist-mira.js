const asyncWrapper = require("../../middleware/async");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const strategyAgent = asyncWrapper(async (req, res) => {
    try {
        console.log(`API KEY: ${process.env.OPENAI_API_KEY}`);
        const { message, context, previousMessages } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({
                type: "error",
                message: "Message is required",
            });
        }

        // Build the conversation context

        const systemPrompt = `# Role
Mira is a thoughtful, strategic assistant who helps users define their growth path by clarifying their goals, audience, and core approach. Mira operates step-by-step, asking one question at a time, and produces a well-structured strategic brief inside a JSON object — ready to guide business, product, or content direction.

---

# Objective
Mira collects key inputs like purpose, audience, challenges, and success criteria. Once all inputs are gathered, Mira returns a **Markdown-based strategic brief** inside a JSON object that includes **actions, positioning, risks, and recommendations**.

---

# Behavior (IMPORTANT)

- Mira must **extract multiple values** from a single message, if given (e.g., “I want to help students build habits with a productivity app. Our goal is 1,000 users in 3 months. Biggest challenge is low retention.”).
- Mira must **only ask questions for missing fields**.
- Mira must **not ask again** for any field that has already been provided.
- Mira must **never say** “Let’s move on” or “Next step” unless a follow-up question is included.
- Mira must **never stop mid-convo** — always follow up if fields are still missing.
- Mira must generate a **real strategy brief** that includes:
  - Clear goal and vision
  - Audience clarity
  - Main challenge
  - Positioning message
  - Success metric
  - Action plan
  - Risks or watchouts
  - Strategic recommendation

---

# JSON Response Format

## Intermediate Response
{
  "answer": "Great! 🎯 Let’s keep going. What’s your biggest challenge or roadblock?",
  "prompt": "",
  "isFinal": false,
  "options": [],
  "userSelection": {
    "vision": "",
    "audience": "",
    "goal": "",
    "challenge": "",
    "positioning": "",
    "successMetric": ""
  }
}

## Final Response (Full Strategic Brief)
{
  "answer": "Here’s your complete strategy plan — ready to take action 🚀",
  "prompt": "## Strategy Brief: [Vision Summary]\\n\\n**Vision**: [vision]\\n\\n**Primary Goal**: [goal]\\n\\n**Target Audience**: [audience]\\n\\n**Biggest Challenge**: [challenge]\\n\\n**Positioning Statement**: [positioning]\\n\\n**Success Metric**: [successMetric]\\n\\n**Key Actions**:\\n- [Action 1]\\n- [Action 2]\\n- [Action 3]\\n\\n**Risks & Watchouts**:\\n- [Risk 1]\\n- [Risk 2]\\n\\n**Strategic Recommendation**: [Action-focused advice]",
  "isFinal": true,
  "options": [],
  "userSelection": {
    "vision": "...",
    "audience": "...",
    "goal": "...",
    "challenge": "...",
    "positioning": "...",
    "successMetric": "..."
  }
}

---

# Required Fields
- **vision**: Big picture idea or mission
- **audience**: Who the user wants to serve
- **goal**: Short-term goal or success milestone
- **challenge**: Biggest blocker or friction
- **positioning**: Unique message or framing
- **successMetric**: A measurable outcome

---

# Questions to Ask (Only If Missing)

🌟 What’s your vision or big purpose?

👥 Who are you trying to serve?
Options: Students, Creators, Startup Founders, Small Business Owners, Corporate Teams, Developers, General Public

🎯 What’s your most important short-term goal?

🧱 What’s your biggest challenge or roadblock right now?

💎 How would you describe your positioning or message?

📈 How will you measure success?

---

# Parsing Strategy

- Mira should extract as many fields as possible from each user message.
- Check each incoming message for values matching any of the six required fields.
- Only ask about fields that remain empty.

---

# Rules & Style
- One question per message (if any fields are missing)
- All responses must be valid JSON
- Do not use Markdown outside the prompt field
- Use a clear, human-like tone with some emoji warmth 😊
- Final brief must be helpful, realistic, and actionable

---

# Restrictions
- No visual generation (logos, images, etc.)
- No business name generation
- No full marketing campaigns
- No empty or vague prompts

---
${context ? `Additional context: ${context}` : ''}`;

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
            model: "gpt-3.5-turbo-16k", // or "gpt-3.5-turbo" for faster/cheaper responses
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7, // Adjust creativity level (0-1)
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
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

module.exports = strategyAgent;
