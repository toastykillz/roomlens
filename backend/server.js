import express from "express";
import cors from "cors";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({
  origin: ["https://roomlens.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "ok", service: "roomlens" }));

// Main room analysis endpoint
app.post("/api/analyze", upload.single("photo"), async (req, res) => {
  try {
    const { length, width, height, windows, roomType } = req.body;

    if (!length || !width || !height) {
      return res.status(400).json({ error: "Room dimensions are required" });
    }

    const hasPhoto = !!req.file;
    const messages = [];

    const systemPrompt = `You are an expert interior designer with 15 years of experience. 
You analyze rooms and provide specific, actionable design advice. 
Always respond with valid JSON only — no markdown, no preamble, no explanation outside the JSON.`;

    const userContent = [];

    if (hasPhoto) {
      const base64 = req.file.buffer.toString("base64");
      const mediaType = req.file.mimetype;
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    userContent.push({
      type: "text",
      text: `Analyze this ${roomType || "bedroom"} (${length}ft x ${width}ft x ${height}ft, ${windows || 1} window(s)).
${hasPhoto ? "Use the photo to detect existing furniture, colors, style, and issues." : "No photo provided — give general advice for these dimensions."}

Respond ONLY with this exact JSON shape:
{
  "style": "detected or recommended style name (2-3 words)",
  "palette": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "neutral": "#hexcode",
    "background": "#hexcode"
  },
  "primaryIssue": "main design problem in 10 words or less",
  "roomScore": 72,
  "suggestions": [
    {
      "title": "short title",
      "description": "1-2 sentences of specific, actionable advice",
      "category": "layout|decor|lighting|storage|color",
      "priority": "high|medium|low",
      "estimatedCost": "$0-50|$50-200|$200-500|$500+"
    }
  ],
  "furniturePlacements": [
    {
      "name": "Bed",
      "x": 0.5,
      "z": 0.2,
      "width": 0.4,
      "depth": 0.3,
      "color": "#8b7355",
      "rotation": 0
    }
  ],
  "moodboard": {
    "keywords": ["word1", "word2", "word3"],
    "textureNotes": "1 sentence about textures and materials to use",
    "lightingNotes": "1 sentence about lighting approach",
    "avoidNotes": "1 sentence about what to avoid"
  }
}

For furniturePlacements: x and z are 0-1 fractions of room length/width. Include 4-7 key furniture pieces appropriate for a ${roomType || "bedroom"}.
For roomScore: score out of 100 based on current state (or potential if no photo).
Include 5-6 suggestions covering different categories.`,
    });

    messages.push({ role: "user", content: userContent });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });

    const text = response.content.map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Analysis error:", err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

// Furniture suggestion endpoint
app.post("/api/furniture-suggestions", async (req, res) => {
  try {
    const { roomType, style, budget, existingPieces } = req.body;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Suggest 6 specific furniture pieces for a ${style} ${roomType}. Budget: ${budget || "moderate"}. 
Existing pieces to work around: ${existingPieces?.join(", ") || "none"}.

Respond ONLY with JSON:
{
  "pieces": [
    {
      "name": "item name",
      "description": "specific style/material description",
      "priceRange": "$X-Y",
      "where": "IKEA|Wayfair|Amazon|thrift store|etc",
      "why": "one sentence on why it fits the room"
    }
  ]
}`
      }]
    });

    const text = response.content.map((c) => c.text || "").join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ success: true, ...parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Roomlens backend running on http://localhost:${PORT}`));
