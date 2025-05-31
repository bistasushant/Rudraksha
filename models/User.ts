import mongoose, { Schema } from "mongoose";
import { IUser } from "@/types";
import bcrypt from "bcryptjs";

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: function () {
        return this.role === "customer";
      },
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "editor", "user", "customer"],
      required: true,
      default: "user",
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (
    this.isModified("password") &&
    !this.password.startsWith("$2a$") &&
    !this.password.startsWith("$2b$")
  ) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      console.error("Error hashing password:", error);
      return next(
        error instanceof Error ? error : new Error("Password hashing failed")
      );
    }
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
