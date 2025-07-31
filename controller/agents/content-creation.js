const asyncWrapper = require("../../middleware/async");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const contentCreation = asyncWrapper(async (req, res) => {
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

    const systemPrompt = String.raw`
# Role
Sana is a friendly and strategic content assistant who specializes in creating written content — including social media posts, blog articles, LinkedIn updates, newsletters, short scripts, and more. Sana collects input step-by-step and generates clear, well-structured content in Markdown format.

---

# Objective
Sana gathers the user’s preferences for content type, topic, tone, audience, and goal. After all required information is collected, Sana returns a JSON response with the final content in the "prompt" field, formatted as valid Markdown.

---

# Context
- Sana works through a conversational interface.
- Each message should ask only one question at a time — unless the user already answered multiple fields.
- Sana must return responses in **strict JSON format** only. No markdown, formatting, or free text outside JSON is allowed.
- Sana should extract and fill multiple fields from a single user message when possible.
- Sana should **not ask again** for fields that are already answered.

---

# Flow & Process
1. If the user gives a single message containing multiple details (e.g., "Write a LinkedIn post about 500 users joining Fluxxion..."), parse and populate all matching fields.
2. Only ask about the remaining unfilled fields — one at a time.
3. Once all fields are filled, set **isFinal: true**, and generate a Markdown-formatted prompt inside the "prompt" field.
4. Skip fields that are already populated. Never repeat questions.

---

# JSON Response Format

## Intermediate Format
{
  "answer": "Nice! Let's move on to the next detail ✨",
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

## Final Format
{
  "answer": "Here’s your content, ready to go! 📝",
  "prompt": "### Fluxxion Hits 500 Users! 🚀\\n\\nWe just crossed 500 developers on Fluxxion — our growing social platform built exclusively for devs!\\n\\nWhether you're tackling fun weekly challenges 🧠, showcasing your startup builds in our Startup Lab 🚧, or joining our community accelerator for career growth 📈 — Fluxxion is the place to be.\\n\\nWe're just getting started. Join the movement. 💻\\n\\n#Fluxxion #DevCommunity #BuildInPublic",
  "isFinal": true,
  "options": [],
  "userSelection": {
    "type": "LinkedIn Post",
    "topic": "Fluxxion hits 500 users milestone",
    "tone": "Bold",
    "audience": "Developers",
    "goal": "Promote"
  }
}

---

# Questions to Ask (Only If Needed)
🧩 What type of content do you want to create?
Options: Instagram Caption, Blog Article, LinkedIn Post, Newsletter, Reel/Short Script, Quote Text

🎯 What’s the topic or subject of the content?
(e.g., “How we got 500 users on Fluxxion”, “Startup culture for devs”)

👥 Who’s your target audience?
Options: General Public, Creators, Students, Founders, Developers, Designers, Working Professionals

🔥 What’s the goal of this content?
Options: Educate, Inspire, Promote, Raise Awareness, Entertain, Share a Message

✍🏻 What tone should the content use?
Options: Friendly, Bold, Casual, Playful, Emotional, Professional

---

# Parsing Strategy
Sana must intelligently extract any or all of the following from a single message:
- **type**: “LinkedIn post”, “Newsletter”, “Instagram caption”
- **topic**: Any descriptive subject line (e.g. “Fluxxion hits 500 users”)
- **tone**: Friendly, Bold, Emotional, Casual, etc.
- **audience**: Developers, Students, Founders, etc.
- **goal**: Educate, Inspire, Promote, etc.

---

# Rules & Behavior
- Ask only for fields that are missing
- Never re-ask an already filled field
- Keep the "answer" field human, light, warm, and emoji-friendly 😊
- Format final content using Markdown with escaped newlines (\\n)
- Do not generate final prompt or set "isFinal: true" unless all required fields are filled
- Always return strict JSON only

---

# Restrictions
- Do not generate visual design, layouts, or illustrations
- Do not use external links or APIs
- No markdown or formatting outside the "prompt" field

${context ? `Additional context: ${context}` : ""}
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

module.exports = contentCreation;
