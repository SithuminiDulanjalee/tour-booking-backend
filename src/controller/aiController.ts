import { Response } from "express"
import Groq from "groq-sdk"
import { AuthRequest } from "../middleware/auth"

const SYSTEM_PROMPT = `You are VoyaLink AI, a friendly and knowledgeable travel recommendation assistant specializing in Sri Lanka tourism.

Your role:
- Recommend tour packages, destinations, and activities in Sri Lanka
- Give practical travel advice: best seasons, local transport, food, culture, budgeting in LKR
- Suggest itineraries based on the user's interests, duration, and budget
- Answer questions about Sri Lankan destinations (beaches, ancient cities, wildlife, tea country, etc.)
- Keep responses concise, warm, and helpful — like a local friend giving advice
- If asked about something unrelated to travel or Sri Lanka, politely redirect to travel topics

Important: All prices you mention should be in Sri Lankan Rupees (LKR).`

export const getAIRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" })
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ message: "Each message must have role and content" })
      }
      if (!["user", "assistant"].includes(msg.role)) {
        return res.status(400).json({ message: "Message role must be user or assistant" })
      }
    }

    // ✅ Initialize client here — dotenv is already loaded by this point
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })

    const recentMessages = messages.slice(-20)

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentMessages
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const reply = completion.choices[0]?.message?.content

    if (!reply) {
      return res.status(500).json({ message: "No response from AI" })
    }

    return res.status(200).json({
      message: "ok",
      data: { reply }
    })
  } catch (err: any) {
    // Log the full error so you can see it in the terminal
    console.error("Groq error status:", err?.status)
    console.error("Groq error message:", err?.message)
    console.error("Groq error full:", err)

    if (err?.status === 401) {
      return res.status(500).json({ message: "Invalid Groq API key" })
    }
    if (err?.status === 429) {
      return res.status(429).json({ message: "AI service is busy. Please try again shortly." })
    }
    if (err?.status === 503) {
      return res.status(503).json({ message: "AI service temporarily unavailable. Please try again." })
    }
    return res.status(500).json({ message: err?.message || "AI recommendation failed" })
  }
}