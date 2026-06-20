import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthRequest extends Request {
  user?: jwt.JwtPayload
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" })
  }

  const token = authHeader.split(" ")[1]

  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing" })
    }

    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}
