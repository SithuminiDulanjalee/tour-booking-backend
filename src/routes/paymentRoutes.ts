import { Router } from "express"
import {
  createPayment,
  getAllPayments,
  getBookingPaymentSummary,
  getMyPayments,
  getPaymentStats,
  updatePaymentStatus
} from "../controller/paymentController"
import { authenticate } from "../middleware/auth"
import { requireRole } from "../middleware/role"
import { UserRole } from "../models/userModel"

const router = Router()

// IMPORTANT: static routes before parameterized ones
router.get("/my", authenticate, getMyPayments)
router.get("/stats", authenticate, requireRole([UserRole.ADMIN]), getPaymentStats)
router.get("/all", authenticate, requireRole([UserRole.ADMIN]), getAllPayments)
router.get("/booking/:bookingId", authenticate, getBookingPaymentSummary)

router.post("/", authenticate, createPayment)
router.put("/:id/status", authenticate, requireRole([UserRole.ADMIN]), updatePaymentStatus)

export default router