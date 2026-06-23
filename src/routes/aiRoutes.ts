import { Router } from "express"
import { getAIRecommendation } from "../controller/aiController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// Only USER role can access AI chat — not ADMIN
router.post(
  "/recommend",
  authenticate,
  requireRole([UserRole.USER]),
  getAIRecommendation
)

export default router