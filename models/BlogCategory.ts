import { IBlogcategory } from "@/types";
import mongoose, { Schema } from "mongoose";

const blogCategorySchema = new Schema<IBlogcategory>(
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
  },
  { timestamps: true }
);
const blogCategory =
  mongoose.models.BlogCategory ||
  mongoose.model<IBlogcategory>("BlogCategory", blogCategorySchema);

async function getBlogcategoriesPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const blogCategories = await blogCategory.find().skip(skip).limit(limit);
    const total = await blogCategory.countDocuments();
    return {
      error: false,
      data: blogCategories,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching blog categories",
    };
  }
}

export { blogCategory, getBlogcategoriesPaginated };
