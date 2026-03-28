const axios = require("axios");
const Chat = require("../models/Chat");

const API_KEY = process.env.OPENROUTER_API_KEY;


const MODELS = [
  "meta-llama/llama-3-8b-instruct",
  "google/gemma-7b-it",
  "mistralai/mistral-7b-instruct"
];
const systemPrompt = `
You are RaviBot, a smart, polite, and reliable AI assistant created by Ravi.

Your goal is to communicate clearly, naturally, and correctly.

---

## LANGUAGE RULES

* Always reply in ONE clear language only.
* If the user writes in English → reply in clear and correct English.
* If the user writes in Hindi → reply in proper Hindi (Devanagari script).
* If the user writes in Hinglish → convert it into ONE clean language:
  • Prefer Hindi if most words are Hindi.
  • Otherwise reply in English.
* NEVER mix Hindi and English in the same sentence.
* NEVER reply in Hinglish.

---

## STRICT RULES (VERY IMPORTANT)

* NEVER generate mixed-language sentences.
* NEVER repeat the same sentence in another language.
* NEVER produce broken, incorrect, or meaningless sentences.
* NEVER use strange symbols or unnecessary characters.
* NEVER behave like a translator.

---

## TONE & STYLE

* Keep replies short, clear, and natural.
* Use simple words for better voice clarity.
* Speak like a real human assistant.
* Be polite, friendly, and helpful.
* Avoid over-explaining unless asked.
* Do NOT repeat your name unnecessarily.
* Do NOT say "I am a language model".

---

## VOICE OPTIMIZATION

* Use short and well-structured sentences.
* Avoid complex or long sentences.
* Make responses easy to read aloud clearly.
* Prefer natural conversational tone.

---

## BEHAVIOR RULES

* If user asks "who are you" → say you are RaviBot.
* If user asks "do you know me" → say you don’t know personally but can help.
* If input is unclear → ask for clarification politely.
* If user greets → respond naturally and politely.
* If user asks for code → always return properly formatted code using code blocks.

---

## EXAMPLES

User: hello
Bot: Hi! How can I help you?

User: who are you
Bot: I m RaviBot, here to help you 😊

User: तुम कैसे हो
Bot: मैं ठीक हूँ। आप कैसे हैं? 😊

User: hello kya kar rahe ho
Bot: Hello! What are you doing?

User: you know me
Bot: I don’t know you personally yet, but I’m here to help 😊

---


## CREATOR INFORMATION (IMPORTANT)

* If the user asks about your creator, developer, owner, or maker:
  → Reply that you were created by Ravi Ranjan Pathak.

* Speak professionally and confidently.

Example:
"I was designed and developed by Ravi Ranjan Pathak, a dedicated full-stack developer focused on building intelligent AI systems."

* If the user asks for source code, portfolio, or contact:
  → Provide helpful information such as GitHub, email, or portfolio.

Example:
"You can explore more or connect here:
GitHub: https://github.com/Raviranjanpathak
Email: ravipathak.pc1@gmail.com
Portfolio: https://raviranjanpathak.github.io/portfolio/"

* Keep the response short, clean, and professional.
* Do NOT expose any private or sensitive information.

## FINAL INSTRUCTION

Always prioritize clarity, correctness, and natural human-like responses.
Never produce confusing, mixed, or broken sentences.
Always ensure the response is clear and easy for voice output.
`;



function cleanResponse(text) {
  if (!text) return "Sorry, I couldn't understand that.";

  // If code detected → skip cleaning
  if (text.includes("#include") || text.includes("printf") || text.includes("{")) {
    return text;
  }

  let cleaned = text.trim();

  // keep basic cleaning only
  cleaned = cleaned.replace(/[_*@]+/g, "");

  return cleaned;
}



exports.chat = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Please login first" });
      }
    
      try {
        const { message, chatId } = req.body;
    
        if (!message || message.trim() === "") {
          return res.json({ reply: "Please enter a message." });
        }
    
        const lowerMsg = message.toLowerCase();
    let reply = "";

if (
  lowerMsg.includes("who created") ||
  lowerMsg.includes("developer") ||
  lowerMsg.includes("owner") ||
  lowerMsg.includes("creator") ||
  lowerMsg.includes("source") ||
  lowerMsg.includes("github") ||
  lowerMsg.includes("contact")
) {
  reply = `You're looking for contact information. Here you go:

You can explore more or connect with me here:

🔗 GitHub: https://github.com/Raviranjanpathak

📧 Email: ravipathak.pc1@gmail.com

🌐 Portfolio: https://raviranjanpathak.github.io/portfolio/

I'm always happy to help and collaborate with you!`;
}
        
    
        
        // WEATHER
        
        if (lowerMsg.includes("weather") || lowerMsg.includes("mausam")) {
          try {
            const weather = await axios.get(
              `https://api.open-meteo.com/v1/forecast?latitude=30.3165&longitude=78.0322&current_weather=true`
            );
    
            const temp = weather.data.current_weather.temperature;
    
            reply = `🌤️ Current weather in Dehradun: ${temp}°C`;
    
          } catch {
            reply = "Weather service not available.";
          }
        }
       // =========== NEWS ===========
      else if (lowerMsg.includes("news") || lowerMsg.includes("khabar")) {
      try {
        let topic = "";
    
        if (lowerMsg.includes("politics")) topic = "politics";
        else if (lowerMsg.includes("sports")) topic = "sports";
        else if (lowerMsg.includes("tech")) topic = "technology";
        else if (lowerMsg.includes("business")) topic = "business";
    
        let articles = [];
    
        
        try {
          let url = topic
            ? `https://newsapi.org/v2/top-headlines?country=in&category=${topic}&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
            : `https://newsapi.org/v2/top-headlines?country=in&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;
    
          const res1 = await axios.get(url);
          articles = res1.data.articles || [];
    
        } catch (err) {
          console.log("Top-headlines failed");
        }
    
        
        if (!articles.length) {
          const query = topic ? `india ${topic}` : "india";
    
          const res2 = await axios.get(
            `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
          );
    
          articles = res2.data.articles || [];
        }
    
      
        if (!articles.length) {
          reply = "No news available right now.";
        } else {
          reply = "📰 Latest News:\n\n";
    
          articles.forEach((a, i) => {
            reply += `${i + 1}. ${a.title}\n`;
          });
        }
    
      } catch (err) {
        console.error("News Error:", err.response?.data || err.message);
        reply = "News service not available.";
      }
    }
       
        //  DATE
        
        else if (lowerMsg.includes("date") || lowerMsg.includes("tareekh")) {
          reply = `📅 Today is ${new Date().toDateString()}`;
        }
    
      
        //  TIME
       
        else if (lowerMsg.includes("time") || lowerMsg.includes("samay")) {
          reply = `⏰ Current time is ${new Date().toLocaleTimeString()}`;
        }
    
       
        //  YEAR
       
        else if (lowerMsg.includes("year") || lowerMsg.includes("saal")) {
          reply = `📆 Current year is ${new Date().getFullYear()}`;
        }
    
      
        //  CALCULATOR
       
        else if (/^[0-9+\-*/().\s]+$/.test(message)) {
          try {
            const result = Function(`"use strict"; return (${message})`)();
            reply = `🧮 ${message} = ${result}`;
          } catch {
            reply = "Invalid calculation.";
          }
        }
    
    
        // AI RESPONSE
       
        else {
          reply = "Sorry, I'm having trouble right now.";
    
          for (let model of MODELS) {
            try {
              const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  model,
                  temperature: 0.5,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                  ]
                },
                {
                  headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                  }
                }
              );
    
              const data = response.data;
    
              if (data.choices?.length > 0) {
                let rawReply = data.choices[0].message.content;
                reply = cleanResponse(rawReply);
                break;
              }
    
            } catch (err) {
              console.log("Model failed:", model);
            }
          }
        }
    
        
        //  SAVE TO CHAT (FIXED)
        
        const chat = await Chat.findById(chatId);
    
        if (!chat) {
          return res.json({ reply: "Chat not found" });
        }
    
        //  user message
        chat.messages.push({
          role: "user",
          content: message
        });
    
        //  bot message
        chat.messages.push({
          role: "bot",
          content: reply
        });
    
        
        if (chat.title === "New Chat") {
          chat.title = message.substring(0, 25);
        }
    
        await chat.save();
    
        res.json({ reply });
    
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
      }
    };
    


exports.newChat = async (req, res) => {
   if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    try {
      const chat = await Chat.create({
        userId: req.session.user._id,
        title: "New Chat",
        messages: []
      });
  
      res.json(chat);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create chat" });
    }
  };


exports.getChats = async (req, res) => {
   if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    const chats = await Chat.find({
      userId: req.session.user._id
    }).sort({ updatedAt: -1 });
  
    res.json(chats);
  };

exports.deleteChat = async (req, res) => {
   if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
};