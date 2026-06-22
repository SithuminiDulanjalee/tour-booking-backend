import { Router } from "express"
import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getMyBookings,
  updateBookingStatus
} from "../controller/bookingController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// IMPORTANT: /my and /all must come BEFORE /:id
router.get("/my", authenticate, getMyBookings)
router.get("/all", authenticate, requireRole([UserRole.ADMIN]), getAllBookings)

router.post("/", authenticate, createBooking)
router.put("/:id/cancel", authenticate, cancelBooking)
router.put("/:id/status", authenticate, requireRole([UserRole.ADMIN]), updateBookingStatus)

export default router