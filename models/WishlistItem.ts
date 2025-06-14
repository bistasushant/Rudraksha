import { IWishlistItem } from "@/types";
import mongoose, { Schema } from "mongoose";

const WishlistItemSchema = new Schema<IWishlistItem>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        productId: {
            type: String,
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        productPrice: {
            type: Number,
            required: true,
        },
        productStock: {
            type: Number,
            required: true,
        },
        productImage: {
            type: String,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

const WishlistItem =
    mongoose.models.WishlistItems ||
    mongoose.model<IWishlistItem>("WishlistItems", WishlistItemSchema);

export default WishlistItem;
