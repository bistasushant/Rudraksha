import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddProductRequest } from "@/lib/validation";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import { ApiResponse, IProduct } from "@/types";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import { subCategory } from "@/models/SubCategory";
import { hasAuth } from "@/lib/auth";
import { productSize } from "@/models/ProductSize";

// Type for lean Product document
interface LeanProduct {
  _id: string;
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId[];
  subcategory?: mongoose.Types.ObjectId[];
  sizes: {
    sizeId: mongoose.Types.ObjectId;
    price: number;
    size: string;
  }[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  feature: boolean;
  designs?: {
    title: string;
    price: number;
    image: string;
  }[];
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Design {
  title: string;
  price: number;
  image: string;
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only admins and editors can add products",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    if (body.image && !body.images) {
      body.images = Array.isArray(body.image) ? body.image : [body.image];
      delete body.image;
    }

    if (!validateAddProductRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product data provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      category,
      subcategory,
      sizes,
      price,
      stock,
      description,
      benefit,
      feature,
      seoTitle,
      metaDescription,
      metaKeywords,
      images,
      designs,
    } = body;

    const validCategories = category.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    const existingCategories = await Category.find({
      _id: { $in: validCategories },
    }).lean();
    if (existingCategories.length !== validCategories.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more categories are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const validSubCategories = subcategory.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    const existingSubCategories = await subCategory.find({
      _id: { $in: validSubCategories },
    }).lean();
    if (existingSubCategories.length !== validSubCategories.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more subcategories are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const validSizes = sizes.map(
      (size: { size?: string; sizeId?: string; price: number }) => {
        if (size.size === 'small') {
          return {
            sizeId: new mongoose.Types.ObjectId(),
            price: Number(size.price),
            size: 'small'
          };
        }
        return {
          sizeId: new mongoose.Types.ObjectId(size.sizeId!),
          price: Number(size.price),
          size: 'small'
        };
      }
    );

    const existingSizes = await productSize.find({
      _id: { $in: validSizes.map(s => s.sizeId) },
    }).lean();
    if(existingSizes.length !== validSizes.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more sizes are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingProduct = await Product.findOne({ slug: productSlug });
    if (existingProduct) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    let processedImages: string[] = [];
    if (images && Array.isArray(images)) {
      processedImages = images.filter(
        (img) =>
          typeof img === "string" &&
          img.startsWith("data:image") &&
          img.includes("base64,")
      );
    }

    let processedDesigns: Design[] = [];
    if (designs && Array.isArray(designs)) {
      processedDesigns = designs.map(design => ({
        title: sanitizeInput(design.title),
        price: Number(design.price),
        image: design.image
      }));
    }

    const productData = {
      name: sanitizeInput(name),
      slug: productSlug,
      category: validCategories,
      subcategory: validSubCategories,
      sizes: validSizes.map(size => ({
        sizeId: size.sizeId,
        price: Number(size.price),
        size: size.size || "small"
      })),
      price,
      stock,
      description: sanitizeInput(description),
      benefit: sanitizeInput(benefit),
      feature: Boolean(feature),
      seoTitle: sanitizeInput(seoTitle || ""),
      metaDescription: sanitizeInput(metaDescription || ""),
      metaKeywords: sanitizeInput(metaKeywords || ""),
      images: processedImages,
      designs: processedDesigns,
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    const productObject = savedProduct.toObject();
    delete productObject.image;
    productObject.images = Array.isArray(productObject.images)
      ? productObject.images
      : [];
    productObject.designs = Array.isArray(productObject.designs)
      ? productObject.designs
      : [];

    const responseData: ApiResponse<IProduct> = {
      error: false,
      message: "Product added successfully",
      data: productObject,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Product Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find({})
      .select("-image")
      .skip(skip)
      .limit(limit)
      .lean<LeanProduct[]>();

    const sanitizedProducts = products.map((product) => {
      const images = Array.isArray(product.images) ? product.images : [];
      const subcategoryIds = Array.isArray(product.subcategory)
        ? product.subcategory.map((sub) => sub.toString())
        : [];
      
      // Create static small size with product's base price
      const staticSmallSize = {
        size: "small",
        price: 0
      };

      // Get other sizes excluding small
      const otherSizes = Array.isArray(product.sizes)
        ? product.sizes
            .filter(size => size.size !== "small")
            .map(size => ({
              sizeId: size.sizeId.toString(),
              price: Number(size.price)
            }))
        : [];

      // Combine static small size with other sizes
      const sizes = [staticSmallSize, ...otherSizes];

      const designs = Array.isArray(product.designs) 
        ? product.designs.map(design => ({
            title: design.title,
            price: Number(design.price),
            image: design.image
          }))
        : [];
      return {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        category: product.category.map((cat) => cat.toString()),
        subcategory: subcategoryIds,
        sizes,
        price: product.price,
        stock: product.stock,
        description: product.description || "",
        benefit: product.benefit || "",
        feature: Boolean(product.feature),
        designs,
        seoTitle: product.seoTitle || "",
        metaDescription: product.metaDescription || "",
        metaKeywords: product.metaKeywords || "",
        images,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    const responseData: ApiResponse<{
      products: IProduct[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Products retrieved successfully",
      data: {
        products: sanitizedProducts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
