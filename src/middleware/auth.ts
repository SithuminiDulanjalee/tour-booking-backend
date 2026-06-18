import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthRequest extends Request {
  user?: any
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" })
  }

  // "Bearer eyJyb2xlIjoiVVNFUiIsInVzZXJJZCI6IjgyNTJkMWM2LTRmZDItNGNhOS1iYjc0LTM5NGNh"
  // ["Bearer", "eyJyb2xlIjoiVVNFUiIsInVzZXJJZCI6IjgyNTJkMWM2LTRmZDItNGNhOS1iYjc0LTM5NGNh"]
  // 0, 1
  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET) // if token invalid trow error
    // req modification ( add req object to payload , key name user)
    req.user = payload
    next()
  } catch (err) {
    console.error(err)
    res.status(401).json({ message: "Invalid or expire token..!" })
  }
}
