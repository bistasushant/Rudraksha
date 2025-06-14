import { ICategory } from "@/types";
import { model, models, Schema, Types } from "mongoose";

// Interface for MongoDB document (before mapping)
interface ICategoryDocument {
  _id: Types.ObjectId;
  image: string;
  name: string;
  slug: string;
  description?: string;
  benefit?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    image: {
      type: String,
      required: true,
    },
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
    description: {
      type: String,
      trim: true,
      default: "",
    },
    benefit: {
      type: String,
      trim: true,
      default: "",
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
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

// 4. Create or reuse the model
export const Category =
  models.Category || model<ICategoryDocument>("Category", categorySchema);

// 5. Helper function to format category document
export function formatCategory(category: ICategoryDocument): ICategory {
  return {
    id: category._id.toString(),
    image: category.image,
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    benefit: category.benefit || "",
    seoTitle: category.seoTitle || "",
    metaDescription: category.metaDescription || "",
    metaKeywords: category.metaKeywords || "",
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// 6. Function to get paginated categories
export async function getCategoriesPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const total = await Category.countDocuments();
    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .lean<ICategoryDocument[]>();

    const formattedCategories = categories.map(formatCategory);

    return {
      error: false,
      data: formattedCategories,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get Categories Error:", error);
    return {
      error: true,
      message: "Error fetching categories",
    };
  }
}
