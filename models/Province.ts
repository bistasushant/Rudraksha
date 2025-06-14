import { IProvinceDocument } from "@/types";
import mongoose, { Schema } from "mongoose";

const provinceSchema = new Schema<IProvinceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

const province =
  mongoose.models.Province ||
  mongoose.model<IProvinceDocument>("Province", provinceSchema);

async function getProvincePagination(page = 1, limit = 10, countryId?: string) {
  try {
    const skip = (page - 1) * limit;

    const filter = countryId ? { countryId } : {};

    const provinces = await province.find(filter).skip(skip).limit(limit);

    const total = await province.countDocuments(filter);

    return {
      error: false,
      data: provinces,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching provinces",
    };
  }
}

export { province, getProvincePagination };
