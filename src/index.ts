import dns from "node:dns"
dns.setServers(["8.8.8.8", "8.8.4.4"])

import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose"
import authRoutes from "./routes/authRoutes"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL || ""

app.use(express.json())
app.use(cors({ origin: true, credentials: true }))

app.get("/", (_req, res) => {
  res.json({ message: "API is running" })
})

app.use("/api/v1/auth", authRoutes)

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("DB connected..!"))
  .catch((err) => console.error("Fail to connect DB..!", err))

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
})
