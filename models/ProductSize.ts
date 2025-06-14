import { ISize } from "@/types";
import mongoose, { Schema } from "mongoose";

const productSizeSchema = new Schema<ISize>(
    {
        size: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    { 
        timestamps: true,
    }
);

// Add virtual for id
productSizeSchema.virtual('id').get(function() {
    return this._id.toString();
});

const productSize = mongoose.models.ProductSize || mongoose.model<ISize>("ProductSize", productSizeSchema);

async function getProductSizePaginated(page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const productSizes = await productSize.find().skip(skip).limit(limit);
        const total = await productSize.countDocuments();
        return {
            error: false,
            data: productSizes,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        return {
            error: true,
            message: "Error fetching product sizes"
        };
    }
}

export { productSize, getProductSizePaginated };