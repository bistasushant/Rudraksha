import { ISubCategory } from "@/types";
import mongoose, { Schema } from "mongoose";

const subCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubCategory",
        required: true,
      },
    ],
    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    metaKeywords: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);
const subCategory =
  mongoose.models.SubCategory ||
  mongoose.model<ISubCategory>("SubCategory", subCategorySchema);

async function getSubCategoriesPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const subCategories = await subCategory.find().skip(skip).limit(limit);
    const total = await subCategory.countDocuments();
    return {
      error: false,
      data: subCategories,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching product subcategories",
    };
  }
}

export { subCategory, getSubCategoriesPaginated };
