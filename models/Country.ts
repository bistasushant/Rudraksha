import { ICountryResponse } from "@/types";
import mongoose, { mongo, Schema } from "mongoose";

const countrySchema = new Schema<ICountryResponse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);
const country =
  mongoose.models.Country ||
  mongoose.model<ICountryResponse>("Country", countrySchema);

async function getCountryPagination(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const countries = await country.find().skip(skip).limit(limit);
    const total = await country.countDocuments();
    return {
      error: false,
      data: countries,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching countries",
    };
  }
}
export { country, getCountryPagination };
