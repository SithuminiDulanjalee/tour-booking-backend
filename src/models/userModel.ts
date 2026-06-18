import { Document, model, Schema } from "mongoose"

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  MANAGER = "MANAGER"
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
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.USER]
    },
    approved: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export const UserModel = model<IUser>("User", userSchema)
