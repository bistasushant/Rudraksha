import { IDesign } from "@/types";
import mongoose, { Schema } from "mongoose";

const productDesignSchema = new Schema<IDesign>(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
const productDesign =
  mongoose.models.ProductDesign ||
  mongoose.model<IDesign>("ProductDesign", productDesignSchema);

async function getProductDesignPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const productDesigns = await productDesign.find().skip(skip).limit(limit);
    const total = await productDesign.countDocuments();
    return {
      error: false,
      data: productDesigns,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching product designs",
    };
  }
}
export { productDesign, getProductDesignPaginated };
