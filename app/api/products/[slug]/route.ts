import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/models/Products";
import { ApiResponse, IProduct } from "@/types";
import { sanitizeInput, validateUpdateProductRequest } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { hasAuth } from "@/lib/auth";

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
      sizes,
      price,
      stock,
      description,
      benefit,
      feature,
      designs,
      seoTitle,
      metaDescription,
      metaKeywords,
      images,
      slug: newSlug,
    } = body;

    const updateData: Partial<IProduct> = {
      name: name,
      category: category.map((id: string) => new mongoose.Types.ObjectId(id)),
      subcategory: subcategory.map((id: string) => new mongoose.Types.ObjectId(id)),
      sizes: sizes.map((size: { sizeId?: string; price: number }) => {
        if ('sizeId' in size) {
          return {
            sizeId: new mongoose.Types.ObjectId(size.sizeId!),
            price: Number(size.price),
            size: 'regular'
          };
        }
        return {
          sizeId: new mongoose.Types.ObjectId(),
          price: Number(size.price),
          size: 'small'
        };
      }),
      price: Number(price),
      stock: Number(stock),
      description: description,
      benefit: benefit,
      feature: Boolean(feature),
      designs: designs || [],
      images: images || [],
    };

    if (seoTitle) updateData.seoTitle = sanitizeInput(seoTitle);
    if (metaDescription)
      updateData.metaDescription = sanitizeInput(metaDescription);
    if (metaKeywords) updateData.metaKeywords = sanitizeInput(metaKeywords);

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
    productObject.designs = productObject.designs || [];
    delete productObject.image; 
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
      .select("name slug category subcategory sizes price stock description benefit feature designs seoTitle metaDescription metaKeywords images createdAt updatedAt")
      .lean<LeanProduct[]>();

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Product not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const sanitizedProducts = products.map(product => {
      const sanitizedProduct = {
        ...product,
        feature: Boolean(product.feature),
        sizes: Array.isArray(product.sizes) ? product.sizes.map(size => ({
          sizeId: size.sizeId.toString(),
          price: Number(size.price)
        })) : [],
        designs: Array.isArray(product.designs) ? product.designs.map(design => ({
          title: design.title,
          price: Number(design.price),
          image: design.image
        })) : []
      };
      return sanitizedProduct as unknown as LeanProduct;
    });

    const responseData: ApiResponse<LeanProduct[]> = {
      error: false,
      message: "Products retrieved successfully",
      data: sanitizedProducts,
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
