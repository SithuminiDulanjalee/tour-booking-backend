import { Router } from "express"
import {
  createTour,
  deleteTour,
  getAdminTours,
  getAllTours,
  getTourById,
  updateTour
} from "../controller/tourController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// Public routes
router.get("/", getAllTours)

// IMPORTANT: admin/all must come BEFORE /:id or Express will match it as an id
router.get("/admin/all", authenticate, requireRole([UserRole.ADMIN]), getAdminTours)
router.post("/", authenticate, requireRole([UserRole.ADMIN]), createTour)

router.get("/:id", getTourById)
router.put("/:id", authenticate, requireRole([UserRole.ADMIN]), updateTour)
router.delete("/:id", authenticate, requireRole([UserRole.ADMIN]), deleteTour)

export default router