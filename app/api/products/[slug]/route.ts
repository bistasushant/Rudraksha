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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectDB();

  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          error: true,
          message: "Product slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Product slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Product slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const products = await Product.find({ slug })
      .select("name slug category subcategory price stock description benefit seoTitle metaDescription metaKeywords images createdAt updatedAt")
      .lean<LeanProduct | null>();

    if (!products) {
      return NextResponse.json(
        {
          error: true,
          message: "Product not found",
        } as ApiResponse,
        { status: 404 }
      );
    }
    const responseData: ApiResponse<LeanProduct> = {
      error: false,
      message: "Products retrieved successfully",
      data: products,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get Product Error:", error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (error instanceof mongoose.Error) {
      return NextResponse.json(
        {
          error: true,
          message: "Database error occurred",
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
