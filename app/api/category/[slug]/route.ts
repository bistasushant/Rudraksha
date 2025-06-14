import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateCategoryRequest } from "@/lib/validation";
import { Category } from "@/models/Category";
import { ApiResponse, ICategory } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { hasAuth } from "@/lib/auth";

// Interface for MongoDB document (before mapping)
interface ICategoryDocument {
  _id: Types.ObjectId | string;
  image: string;
  name: string;
  slug: string;
  description?: string;
  benefit?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to format category document - consistent with GET/POST routes
function formatCategory(category: ICategoryDocument): ICategory {
  return {
    id:
      typeof category._id === "object" ? category._id.toString() : category._id,
    image: category.image || "/placeholder.png",
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    benefit: category.benefit || "",
    seoTitle: category.seoTitle || "",
    metaDescription: category.metaDescription || "",
    metaKeywords: category.metaKeywords || "",
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function PATCH(req: NextRequest) {
  try {
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
          message: "Forbidden: You do not have permission to update categories",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" } as ApiResponse,
        { status: 400 }
      );
    }

    // Add error handling for JSON parsing
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: true, message: "Invalid JSON in request body" } as ApiResponse,
        { status: 400 }
      );
    }


    if (!validateUpdateCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      name,
      image,
      description,
      benefit,
      seoTitle,
      metaDescription,
      metaKeywords,
      isActive,
    } = body;

    // Add error handling for database operation
    let updatedCategoryDoc;
    try {
      updatedCategoryDoc = await Category.findOneAndUpdate(
        { slug },
        {
          ...(name && { name: sanitizeInput(name) }),
          ...(image && { image: sanitizeInput(image) }),
          ...(description !== undefined && {
            description: sanitizeInput(description),
          }),
          ...(benefit !== undefined && {
            benefit: sanitizeInput(benefit),
          }),
          ...(seoTitle !== undefined && { seoTitle: sanitizeInput(seoTitle) }),
          ...(metaDescription !== undefined && {
            metaDescription: sanitizeInput(metaDescription),
          }),
          ...(metaKeywords !== undefined && {
            metaKeywords: sanitizeInput(metaKeywords),
          }),
          ...(typeof isActive === "boolean" && { isActive }),
        },
        { new: true, lean: true }
      );
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        { error: true, message: "Database operation failed" } as ApiResponse,
        { status: 500 }
      );
    }

    if (!updatedCategoryDoc) {
      return NextResponse.json(
        { error: true, message: "Category not found" } as ApiResponse,
        { status: 404 }
      );
    }


    // Add error handling for formatting
    let formattedCategory;
    try {
      formattedCategory = formatCategory(updatedCategoryDoc as unknown as ICategoryDocument);
    } catch (formatError) {
      console.error("Category formatting error:", formatError);
      return NextResponse.json(
        { error: true, message: "Error formatting category data" } as ApiResponse,
        { status: 500 }
      );
    }

    const responseData: ApiResponse<ICategory> = {
      error: false,
      message: "Category updated successfully",
      data: formattedCategory,
    };

    return NextResponse.json(responseData, {
      status: 200,
    });

  } catch (error) {
    console.error("Update Category Error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
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

  // RBAC: Only admin can delete categories
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to delete categories",
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

    const deletedCategory = await Category.findOneAndDelete({ slug }).lean();

    if (!deletedCategory) {
      return NextResponse.json(
        { error: true, message: "Category not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Category deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

// File: app/api/category/[slug]/route.ts
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
          message: "Category slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Category slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Category slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const category = await Category.findOne({ slug })
      .select("name slug image description benefit seoTitle metaDescription metaKeywords isActive createdAt updatedAt")
      .lean<ICategoryDocument | null>();

    if (!category) {
      return NextResponse.json(
        {
          error: true,
          message: "Category not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const formattedCategory = formatCategory(category);

    const responseData: ApiResponse<ICategory> = {
      error: false,
      message: "Category retrieved successfully",
      data: formattedCategory,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get Category Error:", error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid category format",
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

// Handle OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({});
}
