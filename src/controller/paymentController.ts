import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { BookingModel } from "../models/bookingModel"
import { PaymentModel, PaymentStatus } from "../models/paymentModel"

// Helper: get total completed payments for a booking
const getPaidAmount = async (bookingId: string): Promise<number> => {
  const payments = await PaymentModel.find({
    booking: bookingId,
    status: PaymentStatus.COMPLETED
  })
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

// USER: make a payment for a booking
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, amount, method, notes } = req.body

    if (!bookingId || !amount || !method) {
      return res.status(400).json({ message: "Booking, amount, and method are required" })
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      user: req.user?.sub
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot pay for a cancelled booking" })
    }

    const alreadyPaid = await getPaidAmount(bookingId)
    const remaining = booking.totalPrice - alreadyPaid

    if (remaining <= 0) {
      return res.status(400).json({ message: "This booking is already fully paid" })
    }

    if (Number(amount) > remaining) {
      return res.status(400).json({
        message: `Payment exceeds remaining balance of $${remaining.toFixed(2)}`
      })
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" })
    }

    // Generate a simple transaction ID (no payment gateway needed)
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`

    const payment = await PaymentModel.create({
      booking: bookingId,
      user: req.user?.sub,
      amount: Number(amount),
      method,
      status: PaymentStatus.COMPLETED,
      transactionId,
      notes: notes || ""
    })

    const populated = await payment.populate({
      path: "booking",
      select: "totalPrice status",
      populate: { path: "tour", select: "title location" }
    })

    return res.status(201).json({ message: "Payment successful", data: populated })
  } catch (err) {
    return res.status(500).json({ message: "Payment failed" })
  }
}

// USER: get all my payments
export const getMyPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await PaymentModel.find({ user: req.user?.sub })
      .populate({
        path: "booking",
        select: "totalPrice status bookingDate numberOfPeople",
        populate: { path: "tour", select: "title location image" }
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({ message: "Payments fetched", data: payments })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch payments" })
  }
}

// USER: get payment summary for a specific booking
export const getBookingPaymentSummary = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingModel.findOne({
      _id: req.params.bookingId,
      user: req.user?.sub
    }).populate("tour", "title location image price duration")

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    const payments = await PaymentModel.find({
      booking: req.params.bookingId,
      status: PaymentStatus.COMPLETED
    }).sort({ createdAt: -1 })

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const remainingAmount = booking.totalPrice - paidAmount

    return res.status(200).json({
      message: "Summary fetched",
      data: {
        booking,
        payments,
        summary: {
          totalPrice: booking.totalPrice,
          paidAmount,
          remainingAmount,
          isFullyPaid: remainingAmount <= 0
        }
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch summary" })
  }
}

// ADMIN: get all payments
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await PaymentModel.find()
      .populate("user", "name email")
      .populate({
        path: "booking",
        select: "totalPrice status",
        populate: { path: "tour", select: "title location" }
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({ message: "All payments fetched", data: payments })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch payments" })
  }
}

// ADMIN: update payment status
export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    if (!Object.values(PaymentStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" })
    }

    const payment = await PaymentModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("user", "name email")
      .populate("booking", "totalPrice")

    if (!payment) return res.status(404).json({ message: "Payment not found" })

    return res.status(200).json({ message: "Payment status updated", data: payment })
  } catch (err) {
    return res.status(500).json({ message: "Failed to update payment" })
  }
}

// ADMIN: get payment stats
export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const allPayments = await PaymentModel.find()

    const totalRevenue = allPayments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0)

    const refundedAmount = allPayments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + p.amount, 0)

    const totalTransactions = allPayments.length
    const completedCount = allPayments.filter(
      (p) => p.status === PaymentStatus.COMPLETED
    ).length

    return res.status(200).json({
      message: "Stats fetched",
      data: {
        totalRevenue,
        refundedAmount,
        totalTransactions,
        completedCount
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats" })
  }
}