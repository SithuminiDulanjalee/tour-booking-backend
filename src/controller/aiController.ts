import Groq from "groq-sdk"
import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { TourModel } from "../models/tourModel"
import { AILogModel } from "../models/aiLogModel"

// Create Groq client inside function so dotenv is always loaded first
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in .env file")
  }
  return new Groq({ apiKey })
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

// USER: get AI travel recommendation
export const getRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { message, chatHistory } = req.body

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" })
    }

    // Fetch active tours to give AI context about what's available
    const tours = await TourModel.find({ isActive: true })
      .select("title description price duration location category availableSlots")
      .limit(20)

    const toursContext = tours
      .map(
        (t) =>
          `• ${t.title} | 📍 ${t.location} | 💰 $${t.price}/person | ⏱ ${t.duration} days | 🏷 ${t.category} | 🎟 ${t.availableSlots} slots left`
      )
      .join("\n")

    const systemPrompt = `You are VoyageVerde's friendly AI travel assistant 🌍

Here are the currently available tour packages:
${toursContext || "No tours currently available."}

Your job:
- Help users find the best matching tour from the list above
- Ask clarifying questions if needed (budget, interests, travel dates, group size)
- Be specific — reference actual tour names, prices, and durations from the list
- Keep responses concise, warm, and helpful
- If no tour perfectly matches, suggest the closest alternative and explain why
- If the user wants to book, tell them to click "View Details" on the tour page
- Never make up tours that are not in the list above`

    // Build Groq messages array
    const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt }
    ]

    // Include last 8 messages of chat history to stay within token limits
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-8)
      recentHistory.forEach((msg: ChatMessage) => {
        if (msg.role === "user" || msg.role === "assistant") {
          groqMessages.push({ role: msg.role, content: msg.content })
        }
      })
    }

    // Add the current user message
    groqMessages.push({ role: "user", content: message })

    // Call Groq API
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: groqMessages,
      max_tokens: 1024,
      temperature: 0.7
    })

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate a response right now."

    // Save the interaction to the database
    await AILogModel.create({
      user: req.user?.sub,
      message: message.slice(0, 500), // limit stored message length
      response: aiResponse.slice(0, 2000) // limit stored response length
    })

    return res.status(200).json({
      message: "Response generated",
      data: { response: aiResponse }
    })
  } catch (err: any) {
    console.error("Groq AI error:", err?.message || err)
    return res.status(500).json({
      message: "AI service is unavailable. Please check your GROQ_API_KEY and try again."
    })
  }
}

// USER: get my AI chat history
export const getMyAIHistory = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AILogModel.find({ user: req.user?.sub })
      .sort({ createdAt: -1 })
      .limit(50)

    return res.status(200).json({ message: "History fetched", data: logs })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch history" })
  }
}

// ADMIN: get all AI interaction logs with stats
export const getAllAILogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AILogModel.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100)

    const totalInteractions = await AILogModel.countDocuments()
    const uniqueUserIds = await AILogModel.distinct("user")

    return res.status(200).json({
      message: "AI logs fetched",
      data: {
        logs,
        stats: {
          totalInteractions,
          uniqueUsers: uniqueUserIds.length
        }
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch AI logs" })
  }
}