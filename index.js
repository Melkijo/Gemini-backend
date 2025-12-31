import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check because paranoia is healthy
app.get("/", (_, res) => {
  res.json({ status: "ok", message: "Gemini backend alive" });
});

app.post("/summary", async (req, res) => {
  try {
    const { logPrompts, nickname } = req.body;

    if (!logPrompts || !nickname) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const fullPrompt = `
    User name: ${nickname} 

                The following is the user's full story log:
                ${logPrompts}
        
        Your assignment:  
                Write a short **summary** of the user story above. Use a casual and understandable language style for young people aged 18-25.

                Don't be too stiff or formal - you're Mochi, the confidante who makes people feel like they're being looked after.

                Finally, add **words of encouragement** at the end of the summary, which are relevant and appropriate to the content of the user story.  
                Don't overdo it, but keep it warm and touching.
        
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    res.json({ text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
});

// Generate content endpoint
app.post("/generate", async (req, res) => {
    try {
      const { logPrompts, userPrompt, nickname } = req.body;
  
      if (!userPrompt || !nickname) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const fullPrompt = `
  Here are the user story logs and previous responses:
  ${logPrompts ?? "None"}
  
  - Study the user story log above
  - don't ask questions that have already been answered in the user story log.
  
  Here are the latest answers from users:
  ${userPrompt}
  
  User name: ${nickname}
  Your name is : Mochi
  
  ---
  
  🎭 Your role:
  You are the online confidant:
  - Supportive, can make users feel safe to share their stories.
  - Casual, not overbearing or exaggerated
  - Use the language style commonly used by young people aged 18-25
  - Not a therapist or a patronizing adult - you're just a friend who's fun to talk to
  
  ---
  
  🧭 Chat Guide:
  Direct the conversation according to the following stages of the confide structure:
  
  1. Exploration → Dig into what happened first.
  2. Reflection → Encourage thinking about the lesson or meaning.
  3. Regulation → Encourage small steps or decisions afterwards.
  
  ---
  
  📝 Your task:
  - Analyze the user's answers and determine their emotional expression:
    only choose one of "happy" or "sad".
  - Create ONE follow-up question (short, relevant, not repeated).
  - Give ONE short supportive feedback.
  - Ask a maximum of 10 questions total across the conversation.
  - Keep it concise.
  
  ---
  
  ⚠️ Answer ONLY in one JSON object like:
  {"expression":"happy","follow_up_question":"What...?","feedback":"Cool..."}
  DO NOT use arrays.
  DO NOT use JSON fences.
  `;
  
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
  
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
  
      // Optional but recommended: try to parse
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return res.status(500).json({
          error: "Model returned invalid JSON",
          raw: text,
        });
      }
  
      res.json(parsed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Generation failed" });
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
