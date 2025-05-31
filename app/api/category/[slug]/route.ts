import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateCategoryRequest } from "@/lib/validation";
import { Category } from "@/models/Category";
import { ApiResponse, ICategory } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

// Interface for MongoDB document (before mapping)
interface ICategoryDocument {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
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
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    seoTitle: category.seoTitle || "",
    metaDescription: category.metaDescription || "",
    metaKeywords: category.metaKeywords || "",
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// CORS headers - consistent with GET/POST routes
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.FRONTEND_URL || "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to update categories",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();

    if (!validateUpdateCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      name,
      description,
      seoTitle,
      metaDescription,
      metaKeywords,
      isActive,
    } = body;

    const updatedCategoryDoc = await Category.findOneAndUpdate(
      { slug },
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(description !== undefined && {
          description: sanitizeInput(description),
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

    if (!updatedCategoryDoc) {
      return NextResponse.json(
        { error: true, message: "Category not found" } as ApiResponse,
        { status: 404, headers: corsHeaders }
      );
    }

    // Format the category for response - fix type issue by not using explicit cast
    const formattedCategory = formatCategory(
      updatedCategoryDoc as unknown as ICategoryDocument
    );

    const responseData: ApiResponse<ICategory> = {
      error: false,
      message: "Category updated successfully",
      data: formattedCategory,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
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
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const deletedCategory = await Category.findOneAndDelete({ slug }).lean();

    if (!deletedCategory) {
      return NextResponse.json(
        { error: true, message: "Category not found" } as ApiResponse,
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: false, message: "Category deleted successfully" } as ApiResponse,
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
