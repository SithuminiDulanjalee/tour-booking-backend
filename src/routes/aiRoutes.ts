import { Router } from "express"
import {
  getAllAILogs,
  getMyAIHistory,
  getRecommendation
} from "../controller/aiController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// Static routes before parameterized ones
router.get("/history/my", authenticate, getMyAIHistory)
router.get("/logs/all", authenticate, requireRole([UserRole.ADMIN]), getAllAILogs)

router.post("/recommend", authenticate, getRecommendation)

export default router