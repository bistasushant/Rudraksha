import mongoose, { Schema } from "mongoose";
import { IAbout } from "@/types";

const aboutSchema = new Schema<IAbout>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.About ||
  mongoose.model<IAbout>("About", aboutSchema);
