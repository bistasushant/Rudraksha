import { ITestimonial } from "@/types";
import mongoose, { Schema } from "mongoose";

const testimonialSchema = new Schema<ITestimonial>(
  {
    fullName: {
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
    address: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
        type: Number,
        required: true,
        trim: true,
        min: 1,
        max: 5,
    },
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
testimonialSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.fullName.toLowerCase().replace(/ /g, "-");
  }
  next();
});
const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", testimonialSchema);

async function getTestimonialPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const blogs = await Testimonial.find()
      .sort({ createdAt: -1 }) // Show latest products first
      .skip(skip)
      .limit(limit);
    const total = await Testimonial.countDocuments();
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
    console.error("Error fetching testimonials:", error);

    return {
      error: true,
      message: "Error fetching testimonials",
    };
  }
}

export { Testimonial, getTestimonialPaginated };
