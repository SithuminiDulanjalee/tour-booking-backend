import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { BookingModel, BookingStatus, PaymentStage } from "../models/bookingModel"
import { TourModel } from "../models/tourModel"

// USER: create a booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { tourId, bookingDate, numberOfPeople, specialRequests } = req.body

    if (!tourId || !bookingDate || !numberOfPeople) {
      return res.status(400).json({ message: "Tour, date, and number of people are required" })
    }

    const tour = await TourModel.findById(tourId)
    if (!tour) return res.status(404).json({ message: "Tour not found" })
    if (!tour.isActive) return res.status(400).json({ message: "This tour is currently unavailable" })
    if (tour.availableSlots < Number(numberOfPeople)) {
      return res.status(400).json({ message: "Not enough available slots" })
    }

    const totalPrice = tour.price * Number(numberOfPeople)
    // Advance is 30% of total price, rounded to nearest rupee
    const advanceAmount = Math.round(totalPrice * 0.3)

    const booking = await BookingModel.create({
      tour: tourId,
      user: req.user?.sub,
      bookingDate: new Date(bookingDate),
      numberOfPeople: Number(numberOfPeople),
      totalPrice,
      advanceAmount,
      specialRequests: specialRequests || "",
      paymentStage: PaymentStage.UNPAID
    })

    // Reduce available slots after booking
    tour.availableSlots -= Number(numberOfPeople)
    await tour.save()

    const populated = await booking.populate("tour", "title location image price duration")

    return res.status(201).json({ message: "Booking created successfully", data: populated })
  } catch (err) {
    return res.status(500).json({ message: "Failed to create booking" })
  }
}

// USER: get my bookings
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await BookingModel.find({ user: req.user?.sub })
      .populate("tour", "title location image price duration category")
      .sort({ createdAt: -1 })

    return res.status(200).json({ message: "Bookings fetched", data: bookings })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch bookings" })
  }
}

// USER: cancel a booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingModel.findOne({
      _id: req.params.id,
      user: req.user?.sub
    })

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ message: "Booking is already cancelled" })
    }

    // Cannot cancel after full payment
    if (booking.paymentStage === PaymentStage.FULLY_PAID) {
      return res.status(400).json({
        message: "Fully paid bookings cannot be cancelled. Please contact support."
      })
    }

    await TourModel.findByIdAndUpdate(booking.tour, {
      $inc: { availableSlots: booking.numberOfPeople }
    })

    booking.status = BookingStatus.CANCELLED
    await booking.save()

    return res.status(200).json({ message: "Booking cancelled", data: booking })
  } catch (err) {
    return res.status(500).json({ message: "Failed to cancel booking" })
  }
}

// ADMIN: get all bookings
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await BookingModel.find()
      .populate("tour", "title location price")
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    return res.status(200).json({ message: "All bookings fetched", data: bookings })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch bookings" })
  }
}

// ADMIN: update booking status
// Confirm is only allowed when paymentStage is advance_paid
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    if (!Object.values(BookingStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid status value" })
    }

    const booking = await BookingModel.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: "Booking not found" })

    // Admin can only confirm a booking if advance payment has been made
    if (
      status === BookingStatus.CONFIRMED &&
      booking.paymentStage === PaymentStage.UNPAID
    ) {
      return res.status(400).json({
        message: "Cannot confirm booking. User has not paid the advance amount yet."
      })
    }

    booking.status = status as BookingStatus
    await booking.save()

    const updated = await BookingModel.findById(booking._id)
      .populate("tour", "title location")
      .populate("user", "name email")

    return res.status(200).json({ message: "Status updated", data: updated })
  } catch (err) {
    return res.status(500).json({ message: "Failed to update booking status" })
  }
}