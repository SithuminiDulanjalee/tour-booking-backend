import { Document, model, Schema, Types } from "mongoose"

export enum PaymentMethod {
  CARD = "card",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash"
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded"
}

export enum PaymentType {
  ADVANCE = "advance",
  BALANCE = "balance"
}

export interface IPayment extends Document {
  booking: Types.ObjectId
  user: Types.ObjectId
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paymentType: PaymentType
  transactionId: string
  notes: string
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CARD
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.COMPLETED
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true
    },
    transactionId: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
)

export const PaymentModel = model<IPayment>("Payment", paymentSchema)