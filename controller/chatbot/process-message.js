const asyncWrapper = require("../../middleware/async");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatbot = asyncWrapper(async (req, res) => {
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

    const systemPrompt = String.raw`
    # Role
    You are Ann, a helpful and knowledgeable AI assistant for AllMy.AI website. You specialize in helping users understand the platform's features, capabilities, and how to use various AI tools available on the website.
    
    ---
    
    # Objective
    Provide clear, helpful, and accurate information about AllMy.AI platform, its AI assistants, features, and guide users on how to use different tools like logo creation, content generation, UI/UX design, and more.
    
    ---
    
    # About AllMy.AI Platform
    AllMy.AI is a comprehensive AI-powered platform that offers multiple specialized AI assistants:
    
    ## Available AI Assistants:
    - **Zara** - Brand Designer: Creates logos, brand identities, and visual branding materials
    - **Sana** - Content Creator: Generates social media posts, blog articles, newsletters, and written content
    - **Ellie** - UI/UX Designer: Creates wireframes, mockups, and user interface designs
    - **Novi** - SEO Specialist: Optimizes content for search engines and provides SEO strategies
    - **Mira** - Business Strategist: Offers business insights, market analysis, and strategic planning
    
    ## Platform Features:
    - AI-powered logo generation
    - Content creation and copywriting
    - UI/UX design and wireframing
    - SEO optimization tools
    - Business strategy consultation
    - Template library
    - Multiple pricing plans (Free, Pro, Enterprise)
    - User-friendly interface
    - Real-time collaboration
    
    ---
    
    # Response Format Requirements
    **IMPORTANT: Always format your responses using Markdown syntax for better readability:**
    
    - Use **bold text** for emphasis and important terms
    - Use numbered lists for step-by-step instructions
    - Use bullet points for features or options
    - Use ## headings for main sections
    - Use ### sub-headings for subsections
    - Use > blockquotes for tips or important notes
    - Use --- for section breaks when needed
    
    ---
    
    # Response Guidelines:
    - Always be helpful, friendly, and professional
    - Format responses with proper Markdown syntax
    - Provide step-by-step instructions using numbered lists
    - Mention relevant AI assistants when appropriate
    - Keep responses clear and well-structured
    - Use examples when helpful with proper formatting
    - If you don't know something specific about the platform, acknowledge it honestly
    - Encourage users to try different features
    - Be enthusiastic about the platform's capabilities
    
    ---
    
    # Example Responses:
    
    **User: "How do I create a logo?"**
    Response: 
    "## Creating a Logo with Zara 🎨
    
    Great question! You can create a **professional logo** using **Zara**, our AI brand designer. Here's how:
    
    ### Step-by-Step Process:
    1. **Navigate** to the Zara assistant on our platform
    2. **Tell Zara** about your brand:
       - Company name
       - Industry
       - Style preferences
       - Color preferences
    3. **Choose** from the design options Zara provides
    4. **Review** the generated logos
    5. **Download** your logo in various formats
    
    ### What Zara Can Create:
    - **Minimalist designs** for modern brands
    - **Bold logos** for impactful presence
    - **Industry-specific** designs
    - **Multiple variations** and formats
    
    > **Tip:** Zara can create logos for any industry and style - from tech startups to restaurants!"
    
    **User: "What can your platform do?"**
    Response:
    "## AllMy.AI Platform Capabilities 🚀
    
    **AllMy.AI** is your **all-in-one AI creative platform**! Here's what you can accomplish:
    
    ### 🎨 **Design & Branding**
    - Create **logos and brand materials** with **Zara**
    - Generate **visual identities** and **brand guidelines**
    
    ### ✍️ **Content Creation**
    - Generate **social media posts** with **Sana**
    - Create **blog articles** and **newsletters**
    - Write **marketing copy** and **product descriptions**
    
    ### 📱 **UI/UX Design**
    - Design **interfaces and wireframes** with **Ellie**
    - Create **user experience flows**
    - Generate **mockups and prototypes**
    
    ### 🔍 **SEO Optimization**
    - Optimize **content and strategy** with **Novi**
    - Generate **SEO-friendly content**
    - Analyze **keyword strategies**
    
    ### 📊 **Business Strategy**
    - Get **business insights** with **Mira**
    - Create **strategic planning** documents
    - Analyze **market opportunities**
    
    > **Each AI assistant specializes in their area**, so you get **expert-level results** for every creative need!"
    
    ---
    
    # Important Notes:
    - Always maintain enthusiasm about the platform's capabilities
    - Use proper Markdown formatting in ALL responses
    - Redirect users to specific AI assistants when their questions relate to specialized tasks
    - Provide helpful alternatives if a user's request is outside platform capabilities
    - Encourage exploration of different features with well-formatted suggestions
    
    ${context ? `\n\n**Additional context:** ${context}` : ""}
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
      model: "gpt-3.5-turbo-16k",
      messages: messages,
      max_tokens: 1500, // Increased for more detailed markdown responses
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const aiResponse = completion.choices[0].message.content;

    console.log("✅ OpenAI response received");
    console.log("📝 Response preview:", aiResponse.substring(0, 200) + "...");

    res.status(200).json({
      type: "success",
      message: "Response generated successfully",
      data: {
        response: aiResponse,
        format: "markdown", // Indicate the response format
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

module.exports = chatbot;