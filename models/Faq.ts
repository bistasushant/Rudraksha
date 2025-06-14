import { IFaq } from "@/types";
import mongoose, { Schema } from "mongoose";

const faqSchema = new Schema<IFaq> (
    {
        type: {
            type: String,
            required: true,
            enum: ["faq", "image"],
            default: "faq",
          },
        question: {
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
        answer: {
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
            trim: true, 
          },
    },
    { timestamps: true }
);
faqSchema.pre("save", function (next) {
    if (!this.slug) {
        this.slug = this.question.toLowerCase().replace(/ /g, "-");
    }
    next();
});
faqSchema.pre("save", async function (next) {
    if (this.type === "image") {
      const existingImage = await mongoose.models.Faq.findOne({
        type: "image",
        _id: { $ne: this._id }, // Exclude the current document
      });
      if (existingImage) {
        next(new Error("Only one image document is allowed"));
      }
    }
    next();
  });
const Faq = mongoose.models.Faq || mongoose.model<IFaq>("Faq", faqSchema);

async function getFaqPaginated(page = 1, limit = 10) {
    try {
        const skip = (page -1) * limit;
        const faqs = await Faq.find({ type: "faq" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await Faq.countDocuments({ type: "faq" });
    return {
        error: false,
        data: faqs,
        pagination: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
        },
    };
    } catch (error) {
      console.error("Error fetching faqs:", error);
      
      return {
        error: true,
        message: "Error fetching faqs",
      };
    }
}
export { Faq, getFaqPaginated };