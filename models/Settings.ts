import mongoose, { Schema, Document } from "mongoose";
import { ISettings } from "@/types";

const settingsSchema = new Schema<ISettings>(
  {
    googleAnalytics: {
      trackingId: {
        type: String,
        required: false,
        match: /^G-[A-Z0-9]{10}$/,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    logo: {
      url: {
        type: String,
        required: false,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    currency: {
      currency: {
        type: String,
        required: false,
        trim: true,
        enum: ["USD", "NPR"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    title: {
      title: {
        type: String,
        required: false,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    hero: {
      title: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100,
      },
      subtitle: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500,
      },
      videoUrl: {
        type: String,
        required: false,
        trim: true,
      },
      images: {
        type: [String],
        required: false,
        default: [],
        validate: {
          validator: function (images: string[]) {
            return images.length <= 4;
          },
          message: "Cannot upload more than 4 images"
        }
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    }
  },
  {
    timestamps: true,
    strict: true,
    versionKey: false
  }
);

// Add index to ensure only one settings document
settingsSchema.index({}, { unique: true });

const Settings =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
