import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { UserModel, UserRole } from "../models/userModel"
import { AuthRequest } from "../middleware/auth"
import { signAccessToken, signRefreshToken } from "../utils/tokens"

dotenv.config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

const cleanUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  roles: user.roles
})

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      roles: [UserRole.USER],
      approved: true
    })

    return res.status(201).json({
      message: "User registered successfully",
      data: cleanUser(newUser)
    })
  } catch (err) {
    return res.status(500).json({ message: "Registration failed" })
  }
}

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      roles: [UserRole.ADMIN],
      approved: true
    })

    return res.status(201).json({
      message: "Admin registered successfully",
      data: cleanUser(newUser)
    })
  } catch (err) {
    return res.status(500).json({ message: "Admin registration failed" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await UserModel.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    return res.status(200).json({
      message: "Login successful",
      data: {
        user: cleanUser(user),
        accessToken,
        refreshToken
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Login failed" })
  }
}

export const getMyDetails = async (req: AuthRequest, res: Response) => {
  if (!req.user?.sub) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const user = await UserModel.findById(req.user.sub).select("-password")
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  return res.status(200).json({
    message: "ok",
    data: cleanUser(user)
  })
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" })
    }

    if (!JWT_REFRESH_SECRET) {
      return res.status(500).json({ message: "JWT_REFRESH_SECRET is missing" })
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload
    const user = await UserModel.findById(payload.sub)

    if (!user) {
      return res.status(403).json({ message: "Invalid or expired token" })
    }

    const accessToken = signAccessToken(user)

    return res.status(200).json({
      message: "Token refreshed",
      data: { accessToken }
    })
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}
