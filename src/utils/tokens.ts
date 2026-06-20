import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import { IUser } from "../models/userModel"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const signAccessToken = (user: IUser): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing")
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles
    },
    JWT_SECRET,
    { expiresIn: "30m" }
  )
}

export const signRefreshToken = (user: IUser): string => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is missing")
  }

  return jwt.sign(
    {
      sub: user._id.toString()
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  )
}
