import mongoose, { Schema } from "mongoose";
import { IContent } from "@/types";

const ContentSchema: Schema = new Schema<IContent>(
  {
    type: {
      type: String,
      enum: ["banner", "package"],
      required: [true, "Type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      minlength: [1, "Title cannot be empty"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      minlength: [1, "Description cannot be empty"],
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Content =
  mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);