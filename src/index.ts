import dns from "node:dns"
dns.setServers(["8.8.8.8", "8.8.4.4"])
import dotenv from "dotenv"
dotenv.config()

import express from "express"
import mongoose from "mongoose"
import authRoutes from "./routes/authRoutes"
import cors from "cors"

const app = express()

const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL || ""

// Goble Middlewares (avery request)
app.use(express.json())
app.use(cors())

// app.use((req, res, next) => {
//   next()
// })

// Mount routes
app.get("/", (req,res)=>{
  res.send("ok")
})

app.use("/api/v1/auth", authRoutes)

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("DB connected..!")
    // app.listen(5000, () => {
    //   console.log("Server running on port: 50000")
    // })
  })
  // FIX: log the actual error object so you can see what went wrong
  .catch((err) => console.error("Fail to connect DB..!", err))

app.listen(PORT, () => {
  console.log("Server running on port: ", PORT)
})
