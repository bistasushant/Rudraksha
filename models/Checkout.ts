import mongoose, { Schema, model } from "mongoose";
import { ICheckout, PaginationResponse } from "@/types";
import { Product } from "./Products";


const checkoutSchema = new Schema<ICheckout>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartId: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    shippingDetails: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true },
      provinceId: { type: Schema.Types.ObjectId, ref: "Province", required: true },
      cityId: { type: Schema.Types.ObjectId, ref: "City", required: true },
      postalCode: { type: String, trim: true },
      locationUrl: { type: String, trim: true },
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        size: {
          size: { type: String },
          price: { type: Number },
          sizeId: { type: String }
        },
        design: {
          title: { type: String },
          price: { type: Number },
          image: { type: String }
        }
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    itemsCount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirm",
        "processing",
        "pickup",
        "on the way",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      required: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster lookup
checkoutSchema.index({ customerId: 1, cartId: 1 });

// Pre-save hook to validate data
checkoutSchema.pre("save", async function (next) {
  try {
    // Ensure required fields are set
    if (this.isNew) {
      this.paymentStatus ??= "unpaid";
    }

    const cart = await mongoose.model("Cart").findById(this.cartId);
    if (!cart) {
      throw new Error(`Cart not found for ID: ${this.cartId}`);
    }
    if (cart.items.length === 0) {
      throw new Error("Cannot create checkout with an empty cart");
    }
    const user = await mongoose.model("User").findById(this.customerId);
    if (!user) {
      throw new Error(`User not found for ID: ${this.customerId}`);
    }
    if (this.itemsCount === 0) {
      throw new Error("No valid items in cart");
    }
    if (!this.items || this.items.length === 0) {
      throw new Error("Checkout items array cannot be empty");
    }
    if (this.items.length !== cart.items.length) {
      throw new Error("Checkout items do not match cart items");
    }
    for (let i = 0; i < this.items.length; i++) {
      const checkoutItem = this.items[i];
      const cartItem = cart.items[i];
      if (
        checkoutItem.productId.toString() !== cartItem.productId.toString() ||
        checkoutItem.quantity !== cartItem.quantity
      ) {
        throw new Error("Checkout items do not match cart items");
      }
    }
    for (const item of this.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found for ID: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product: ${item.name || item.productId}`
        );
      }
    }
    next();
  } catch (error) {
    console.error("Pre-save hook error:", error);
    next(error as Error);
  }
});

// Model
const Checkout =
  mongoose.models.Checkout || model<ICheckout>("Checkout", checkoutSchema);

// Utility function to format lean checkout objects
function formatCheckoutLean(checkout: any): ICheckout {
  return {
    ...checkout,
    _id: checkout._id.toString(),
    customerId: checkout.customerId.toString(),
    cartId: checkout.cartId.toString(),
    shippingDetails: {
      ...checkout.shippingDetails,
      countryId: checkout.shippingDetails.countryId.toString(),
      provinceId: checkout.shippingDetails.provinceId.toString(),
      cityId: checkout.shippingDetails.cityId.toString(),
    },
    items: checkout.items.map((item: any) => ({
      ...item,
      productId: item.productId.toString(),
    })),
    createdAt:
      checkout.createdAt instanceof Date
        ? checkout.createdAt.toISOString()
        : checkout.createdAt,
    updatedAt:
      checkout.updatedAt instanceof Date
        ? checkout.updatedAt.toISOString()
        : checkout.updatedAt,
  };
}

// Pagination function
async function getCheckoutsPaginated(
  page = 1,
  limit = 10
): Promise<PaginationResponse<ICheckout>> {
  try {
    const skip = (page - 1) * limit;

    const checkouts = await Checkout.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format checkouts to match ICheckoutLean
    const formattedCheckouts = checkouts.map(formatCheckoutLean);

    const total = await Checkout.countDocuments();

    return {
      error: false,
      data: formattedCheckouts,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    return {
      error: true,
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

export async function getCheckoutById(id: string): Promise<ICheckout | null> {
  try {
    const checkout = await Checkout.findById(id).lean();
    if (!checkout) return null;

    // Format the lean object to match ICheckoutLean
    return formatCheckoutLean(checkout);
  } catch (error) {
    console.error("Error fetching checkout by ID:", error);
    return null;
  }
}

export { Checkout, getCheckoutsPaginated };
