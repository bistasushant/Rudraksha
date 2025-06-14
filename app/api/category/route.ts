import { ApiResponse, ICategory } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { Category } from "@/models/Category";
import { sanitizeInput, validateAddCategoryRequest } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";
import { hasAuth } from "@/lib/auth";

// Interface for MongoDB document (before mapping)
interface ICategoryDocument {
  _id: Types.ObjectId;
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

// Helper function to format category document
function formatCategory(category: ICategoryDocument): ICategory {
  return {
    id: category._id.toString(),
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

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Category.countDocuments();
    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .lean<ICategoryDocument[]>();

    const formattedCategories = categories.map(formatCategory);

    const responseData: ApiResponse<{
      categories: ICategory[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Categories retrieved successfully",
      data: {
        categories: formattedCategories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      // headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      {
        status: 500,
        // headers: corsHeaders
      }
    );
  }
}

// Modified POST section in your API route file
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
        message: "Forbidden: Only admins and editors can add category",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const body = await req.json();

    if (!validateAddCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      name,
      image,
      slug,
      description,
      benefit,
      seoTitle,
      metaDescription,
      metaKeywords,
      isActive,
    } = body;

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    // Ensure fields are explicitly defined even if empty
    const categoryData = {
      name: sanitizeInput(name),
      image: sanitizeInput(image),
      slug: sanitizeInput(slug),
      // For description, use sanitizeInput with HTML allowed
      description: sanitizeInput(description || ""),
      benefit: sanitizeInput(benefit || ""),
      seoTitle: sanitizeInput(seoTitle || ""),
      metaDescription: sanitizeInput(metaDescription || ""),
      metaKeywords: sanitizeInput(metaKeywords || ""),
      isActive: isActive ?? true,
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    const formattedCategory = formatCategory(savedCategory.toObject());

    const responseData: ApiResponse<ICategory> = {
      error: false,
      message: "Category added successfully",
      data: formattedCategory,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {}
    // { headers: corsHeaders }
  );
}
