import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { BookingModel, BookingStatus, PaymentStage } from "../models/bookingModel"
import {
  PaymentModel,
  PaymentStatus,
  PaymentType
} from "../models/paymentModel"

// All amounts are in LKR (Sri Lanka Rupees)

// USER: make a payment (advance or balance)
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

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ message: "Cannot pay for a cancelled booking" })
    }

    const paidAmount = Number(amount)

    if (paidAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" })
    }

    let paymentType: PaymentType
    let expectedAmount: number

    // ADVANCE PAYMENT: only allowed when paymentStage is unpaid
    if (booking.paymentStage === PaymentStage.UNPAID) {
      paymentType = PaymentType.ADVANCE
      expectedAmount = booking.advanceAmount

      if (paidAmount !== expectedAmount) {
        return res.status(400).json({
          message: `Advance payment must be exactly LKR ${expectedAmount.toLocaleString("en-LK")}`
        })
      }

    // BALANCE PAYMENT: only allowed when booking is confirmed and advance is paid
    } else if (booking.paymentStage === PaymentStage.ADVANCE_PAID) {
      if (booking.status !== BookingStatus.CONFIRMED) {
        return res.status(400).json({
          message: "Balance payment is only available after the admin confirms your booking."
        })
      }

      paymentType = PaymentType.BALANCE
      expectedAmount = booking.totalPrice - booking.advanceAmount

      if (paidAmount !== expectedAmount) {
        return res.status(400).json({
          message: `Balance payment must be exactly LKR ${expectedAmount.toLocaleString("en-LK")}`
        })
      }

    } else {
      return res.status(400).json({ message: "This booking is already fully paid." })
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`

    const payment = await PaymentModel.create({
      booking: bookingId,
      user: req.user?.sub,
      amount: paidAmount,
      method,
      status: PaymentStatus.COMPLETED,
      paymentType,
      transactionId,
      notes: notes || ""
    })

    // Update paymentStage on the booking
    if (paymentType === PaymentType.ADVANCE) {
      booking.paymentStage = PaymentStage.ADVANCE_PAID
    } else if (paymentType === PaymentType.BALANCE) {
      booking.paymentStage = PaymentStage.FULLY_PAID
    }
    await booking.save()

    const populated = await payment.populate({
      path: "booking",
      select: "totalPrice advanceAmount status paymentStage",
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
        select: "totalPrice advanceAmount status paymentStage bookingDate numberOfPeople",
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

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    const payments = await PaymentModel.find({
      booking: req.params.bookingId,
      status: PaymentStatus.COMPLETED
    }).sort({ createdAt: -1 })

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const balanceAmount = booking.totalPrice - booking.advanceAmount
    const remainingAmount = booking.totalPrice - paidAmount

    return res.status(200).json({
      message: "Summary fetched",
      data: {
        booking,
        payments,
        summary: {
          totalPrice: booking.totalPrice,
          advanceAmount: booking.advanceAmount,
          balanceAmount,
          paidAmount,
          remainingAmount,
          paymentStage: booking.paymentStage,
          isFullyPaid: booking.paymentStage === PaymentStage.FULLY_PAID
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
        select: "totalPrice advanceAmount status paymentStage",
        populate: { path: "tour", select: "title location" }
      })
      .sort({ createdAt: -1 })

    return res.status(200).json({ message: "All payments fetched", data: payments })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch payments" })
  }
}

// ADMIN: update payment status (e.g. mark as refunded)
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
      .populate("booking", "totalPrice advanceAmount paymentStage")

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

    const advanceRevenue = allPayments
      .filter(
        (p) =>
          p.status === PaymentStatus.COMPLETED &&
          p.paymentType === PaymentType.ADVANCE
      )
      .reduce((sum, p) => sum + p.amount, 0)

    const balanceRevenue = allPayments
      .filter(
        (p) =>
          p.status === PaymentStatus.COMPLETED &&
          p.paymentType === PaymentType.BALANCE
      )
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
        advanceRevenue,
        balanceRevenue,
        refundedAmount,
        totalTransactions,
        completedCount
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats" })
  }
}