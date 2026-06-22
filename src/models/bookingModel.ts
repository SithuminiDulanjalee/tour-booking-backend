import { Document, model, Schema, Types } from "mongoose"

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled"
}

export interface IBooking extends Document {
  tour: Types.ObjectId
  user: Types.ObjectId
  bookingDate: Date
  numberOfPeople: number
  totalPrice: number
  status: BookingStatus
  specialRequests: string
}

const bookingSchema = new Schema<IBooking>(
  {
    tour: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingDate: { type: Date, required: true },
    numberOfPeople: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING
    },
    specialRequests: { type: String, default: "" }
  },
  { timestamps: true }
)

export const BookingModel = model<IBooking>("Booking", bookingSchema)