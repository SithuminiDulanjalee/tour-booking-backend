import dns from "node:dns"
dns.setServers(["8.8.8.8", "8.8.4.4"])

import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose"
import aiRoutes from "./routes/aiRoutes"
import authRoutes from "./routes/authRoutes"
import bookingRoutes from "./routes/bookingRoutes"
import paymentRoutes from "./routes/paymentRoutes"
import tourRoutes from "./routes/tourRoutes"

dotenv.config()
console.log("GROQ KEY loaded:", !!process.env.GROQ_API_KEY)

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL || ""

app.use(express.json())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://tour-booking-frontend-sigma.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  })
)
app.use(cors())

app.get("/", (_req, res) => {
  res.json({ message: "VoyaLink API is running" })
})

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/tours", tourRoutes)
app.use("/api/v1/bookings", bookingRoutes)
app.use("/api/v1/payments", paymentRoutes)
app.use("/api/v1/ai", aiRoutes)

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("DB connected..!"))
  .catch((err) => console.error("Fail to connect DB..!", err))

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
})