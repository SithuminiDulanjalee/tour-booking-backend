import { Document, model, Schema, Types } from "mongoose"

export interface IAILog extends Document {
  user: Types.ObjectId
  message: string
  response: string
}

const aiLogSchema = new Schema<IAILog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    response: { type: String, required: true }
  },
  { timestamps: true }
)

export const AILogModel = model<IAILog>("AILog", aiLogSchema)