import { ICityDocument } from "@/types";
import mongoose, { Schema } from "mongoose";

const citySchema = new Schema<ICityDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Province",
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create City model
const city =
  mongoose.models.City || mongoose.model<ICityDocument>("City", citySchema);

// City pagination function
async function getCityPagination(page = 1, limit = 10, provinceId?: string) {
  try {
    const skip = (page - 1) * limit;
    const filter = provinceId ? { provinceId } : {};

    const cities = await city.find(filter).skip(skip).limit(limit);

    const total = await city.countDocuments(filter);

    return {
      error: false,
      data: cities,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching cities:", error);
    return {
      error: true,
      message: "Error fetching cities",
    };
  }
}

export { city, getCityPagination };
