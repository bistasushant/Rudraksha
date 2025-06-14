import { IBenefit } from "@/types";
import mongoose, { Schema } from "mongoose";

const benefitSchema = new Schema<IBenefit>(
    {
        title: {
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
    },
    { timestamps: true }
);
benefitSchema.pre("save", function (next) {
    if(!this.slug) {
        this.slug = this.title.toLowerCase().replace(/ /g, "-");
    }
    next();
});
const Benefit = mongoose.models.Benefit || mongoose.model<IBenefit>("Benefit", benefitSchema);

async function getBenefitsPaginated(page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const benefits = await Benefit.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        const total = await Benefit.countDocuments();
        return {
            error: false,
            data: benefits,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error fetching benefits:", error);

        return {
            error: true,
            message: "Error fetching benefits",
        };
    }
}
export { Benefit, getBenefitsPaginated };