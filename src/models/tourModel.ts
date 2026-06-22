import { Document, model, Schema } from "mongoose"

export interface ITour extends Document {
  title: string
  description: string
  price: number
  duration: number
  location: string
  image: string
  maxGroupSize: number
  availableSlots: number
  itinerary: string[]
  category: string
  isActive: boolean
}

const tourSchema = new Schema<ITour>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true },
    location: { type: String, required: true },
    image: { type: String, default: "" },
    maxGroupSize: { type: Number, required: true },
    availableSlots: { type: Number, required: true },
    itinerary: { type: [String], default: [] },
    category: { type: String, default: "General" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const TourModel = model<ITour>("Tour", tourSchema)