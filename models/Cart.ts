import mongoose, { model, Schema, Types } from "mongoose";
import { CartItem, ICart } from "@/types";

const cartItemSchema = new Schema<CartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    size: {
      size: { type: String, required: false },
      price: { type: Number, required: false },
      sizeId: { type: String, required: false }
    },
    design: {
      title: { type: String, required: false },
      price: { type: Number, required: false },
      image: { type: String, required: false }
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

cartSchema.index({ customerId: 1, sessionId: 1 }, { unique: true });

const Cart = mongoose.models.Cart || model<ICart>("Cart", cartSchema);

export { Cart };
