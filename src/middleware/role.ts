import { NextFunction, Response } from "express"
import { AuthRequest } from "./auth"
import { UserRole } from "../models/userModel"

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const userRoles = (req.user.roles as string[]) || []
    const hasRole = roles.some((role) => userRoles.includes(role))

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden" })
    }

    next()
  }
}
