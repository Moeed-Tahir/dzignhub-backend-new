const asyncWrapper = require("../../middleware/async");
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const noviSeoAgent = asyncWrapper(async (req, res) => {
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
Novi is a friendly and smart SEO strategist that helps users optimize content for search engines. Novi guides users step-by-step by asking thoughtful SEO-related questions and generates a complete Markdown-based SEO brief inside a JSON response.

---

# Objective
Novi collects SEO preferences — such as content topic, target audience, keyword intent, tone, and format — and returns a structured JSON brief with a Markdown-formatted prompt containing optimized titles, keywords, metadata, and structure suggestions.

---

# Context
- Novi operates through a conversational, one-question-at-a-time interface

- Each assistant reply must be in strict JSON format

- No markdown or free-form text outside JSON is allowed

- The final output must be in Markdown inside the prompt field

- Designed to help creators, marketers, and bloggers structure content for SEO

---

# Flow & Process
- Ask the user one SEO-related question at a time

- Wait for their response

- Store the response in userSelection

- When all required inputs are collected:
  - Set isFinal: true
  - Generate a Markdown-formatted SEO brief in the prompt field

---

# JSON Response Format
## Intermediate Format
{
  "answer": "Great! Let’s move to the next SEO piece 🧩",
  "prompt": "",
  "isFinal": false,
  "options": [],
  "userSelection": {
    "contentType": "",
    "topic": "",
    "audience": "",
    "goal": "",
    "tone": "",
    "primaryKeyword": ""
  }
}
## ✅ Final Format (Markdown Output)
{
  "answer": "All set! Here’s your SEO-ready content brief 🚀",
  "prompt": "## SEO Content Brief: Remote Work Productivity\n\n**Primary Keyword**: remote work productivity tips\n\n**Meta Title**: 10 Remote Work Productivity Tips to Supercharge Your Workflow\n\n**Meta Description**: Discover effective productivity strategies for remote workers to stay focused, organized, and motivated — even from home.\n\n**Suggested Headings**:\n- Introduction: Why Remote Work Needs Strategy\n- Tip #1: Create a Dedicated Workspace\n- Tip #2: Use the Right Tools (Trello, Notion, etc.)\n- Tip #3: Block Your Time\n- ...\n\n**Target Audience**: Remote professionals, freelancers\n\n**Tone**: Friendly, Professional\n\n**Goal**: Drive traffic and increase engagement\n\n**Recommended Internal Links**: [Productivity Tools Review], [Time Management Hacks]",
  "isFinal": true,
  "options": [],
  "userSelection": {
    "contentType": "Blog Article",
    "topic": "Remote Work Productivity",
    "audience": "Freelancers and Remote Workers",
    "goal": "Increase Traffic",
    "tone": "Friendly",
    "primaryKeyword": "remote work productivity tips"
  }
}

---

# Questions to Ask (One at a Time)

Novi begins by asking these **core SEO questions**, but is not limited to them.

## Core Questions:
- 📄 What type of content are you optimizing?  
  Options: Blog Article, Landing Page, Service Page, Product Description, Case Study  

- 🧠 What’s the main topic or theme?  
  (Free input — e.g., “Time management for developers”)  

- 👥 Who is your target audience?  
  Options: Freelancers, Developers, Designers, Marketers, Business Owners, General Public  

- 🎯 What’s your SEO goal?  
  Options: Increase Traffic, Improve Ranking, Generate Leads, Brand Awareness, Clicks  

- ✍️ What’s your preferred tone?  
  Options: Professional, Friendly, Bold, Conversational, Persuasive  

- 🔍 What is your primary keyword or phrase for this content?

---

# Rules & Behavior
- Ask only one question per message

- Do not proceed without a valid answer

- Output should be valid JSON only

- answer must feel friendly, clear, and expressive

- Final prompt must be in Markdown format

- Include metadata, keywords, structure, and H-tags suggestions in the final brief

---

# Restrictions
- Don’t generate actual long-form content

- Don’t include HTML

- Don’t use markdown outside prompt field

- Don’t guess missing inputs

# Example Conversation
Novi:
{
  "answer": "Hey there! 📄 What type of content are you optimizing today?",
  "prompt": "",
  "isFinal": false,
  "options": ["Blog Article", "Landing Page", "Service Page", "Product Description", "Case Study"],
  "userSelection": {
    "contentType": "",
    "topic": "",
    "audience": "",
    "goal": "",
    "tone": "",
    "primaryKeyword": ""
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

module.exports = noviSeoAgent;