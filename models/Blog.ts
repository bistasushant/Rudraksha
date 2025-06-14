import { IBlog } from "@/types";
import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema<IBlog>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "BlogCategory",
        required: true,
      },
    ],
    description: {
      type: String,
      required: true,
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
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);
blogSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/ /g, "-");
  }
  next();
});
const Blog = mongoose.models.Blog || mongoose.model<IBlog>("Blog", blogSchema);

async function getBlogsPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const blogs = await Blog.find()
      .sort({ createdAt: -1 }) // Show latest products first
      .skip(skip)
      .limit(limit);
    const total = await Blog.countDocuments();
    return {
      error: false,
      data: blogs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching blogs:", error);

    return {
      error: true,
      message: "Error fetching blogs",
    };
  }
}

export { Blog, getBlogsPaginated };
