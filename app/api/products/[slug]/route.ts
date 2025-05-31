import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/models/Products";
import { ApiResponse, IProduct } from "@/types";
import { hasAuth } from "@/lib/hasAuth";
import { sanitizeInput, validateUpdateProductRequest } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// Type for lean Product document
interface LeanProduct {
  _id: string;
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId[];
  subcategory?: mongoose.Types.ObjectId[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function PATCH(req: NextRequest) {
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
        message: "Forbidden: Only admins and editors can update products",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" } as ApiResponse,
        { status: 400 }
      );
    }

    // Get request body
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (!validateUpdateProductRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      name,
      category,
      subcategory,
      price,
      stock,
      description,
      benefit,
      seoTitle,
      metaDescription,
      metaKeywords,
      images,
      slug: newSlug,
    } = body;

    const updateData: Partial<IProduct> = {};

    if (name) updateData.name = sanitizeInput(name);
    if (Array.isArray(category)) {
      updateData.category = category.map((cat) => sanitizeInput(cat));
    }
    if (Array.isArray(subcategory)) {
      updateData.subcategory = subcategory.map((sub) => sanitizeInput(sub));
    }
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (description) updateData.description = sanitizeInput(description);
    if (benefit) updateData.benefit = sanitizeInput(benefit);
    if (seoTitle) updateData.seoTitle = sanitizeInput(seoTitle);
    if (metaDescription)
      updateData.metaDescription = sanitizeInput(metaDescription);
    if (metaKeywords) updateData.metaKeywords = sanitizeInput(metaKeywords);
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          { error: true, message: "Images must be an array" } as ApiResponse,
          { status: 400 }
        );
      }
      const processedImages = images.filter(
        (img) =>
          typeof img === "string" &&
          img.startsWith("data:image") &&
          img.includes("base64,")
      );

      updateData.images = processedImages;
    }
    if (newSlug) {
      if (newSlug !== slug) {
        const existingProduct = await Product.findOne({ slug: newSlug });
        if (existingProduct) {
          return NextResponse.json(
            { error: true, message: "New slug already in use" } as ApiResponse,
            { status: 400 }
          );
        }
      }
      updateData.slug = sanitizeInput(newSlug);
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }
    const productObject = updatedProduct.toObject();
    productObject.images = productObject.images || [];
    delete productObject.image; // Remove any stray image field
    return NextResponse.json(
      {
        error: false,
        message: "Product updated successfully",
        data: productObject,
      } as ApiResponse<IProduct>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Product Error:", error);
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

export async function DELETE(req: NextRequest) {
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
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only admins can delete products",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" } as ApiResponse,
        { status: 400 }
      );
    }

    const deletedProduct = await Product.findOneAndDelete({ slug });

    if (!deletedProduct) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Product deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Product Error:", error);
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
      return {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        category: product.category.map((cat) => cat.toString()),
        subcategory: subcategoryIds,
        price: product.price,
        stock: product.stock,
        description: product.description || "",
        benefit: product.benefit || "",
        seoTitle: product.seoTitle || "",
        metaDescription: product.metaDescription || "",
        metaKeywords: product.metaKeywords || "",
        images,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // New: Count products added this month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const newProductsCount = await Product.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const responseData: ApiResponse<{
      products: IProduct[];
      total: number;
      newProductsCount: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Products retrieved successfully",
      data: {
        products: sanitizedProducts,
        total,
        newProductsCount,
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
