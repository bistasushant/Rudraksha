import mongoose, { Schema } from "mongoose";
import { IProduct } from "@/types";

const ProductSchema = new Schema<IProduct>(
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
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    subcategory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subcategory",
        required: true,
      },
    ],
    sizes: [
      {
        sizeId: {
          type: Schema.Types.ObjectId,
          ref: "ProductSize",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        size: {
          type: String,
          required: true,
          enum: ['small', 'regular'],
          default: 'regular'
        }
      }
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    benefit: {
      type: String,
      required: true,
      trim: true,
    },
    feature: {
      type: Boolean,
      required: true,
      default: false,
    },
    designs: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        image: {
          type: String,
          required: true,
        }
      }
    ],
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
    images: [{ type: String }], 
  },
  { timestamps: true }
);

// Add a pre-save hook to debug and ensure slug is present
ProductSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/ /g, "-");
  }
  
  // Ensure there's at least one size (small) with the same price as product
  if (!this.sizes || this.sizes.length === 0) {
    this.sizes = [{
      sizeId: new mongoose.Types.ObjectId(),
      price: this.price,
      size: 'small'
    }];
  }
  
  next();
});

// Keep the model name matching what you're using elsewhere
const Product =
  mongoose.models.Products ||
  mongoose.model<IProduct>("Products", ProductSchema);

// Keep your pagination code intact
async function getProductsPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const products = await Product.find()
      .sort({ createdAt: -1 }) // Show latest products first
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    return {
      error: false,
      data: products,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      error: true,
      message: "Error fetching products",
    };
  }
}

export { Product, getProductsPaginated };
