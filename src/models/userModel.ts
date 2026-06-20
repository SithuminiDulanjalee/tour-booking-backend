import { Document, model, Schema } from "mongoose"

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER"
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  roles: UserRole[]
  approved: boolean
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.USER]
    },
    approved: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const UserModel = model<IUser>("User", userSchema)
