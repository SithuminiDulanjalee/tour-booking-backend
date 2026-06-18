import { Router } from "express"
import {
  getMyDetails,
  login,
  refreshToken,
  registerAdmin,
  registerUser
} from "../controller/authController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// POST - http://localhost:5000/api/v1/auth/register
router.post("/register", registerUser)

// Login
// POST - /api/v1/auth/login
router.post("/login", login)

// Protected
router.get("/me", authenticate, getMyDetails)

// Protected (Only for ROLE ADMIN - Authorization )
router.post(
  "/admin/register",
  authenticate,
  requireRole([UserRole.ADMIN]),
  registerAdmin
)

router.post("/refresh", refreshToken)

// ADMIN
// requireRole([UserRole.ADMIN]),

// ADMIN & MANGER
// requireRole([UserRole.ADMIN, UserRole.MANAGER]),

export default router
