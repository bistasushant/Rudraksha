import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateAddProductSubCategoryRequest,
} from "@/lib/validation";
import { Category } from "@/models/Category";
import { subCategory } from "@/models/SubCategory";
import { ApiResponse, ISubCategory } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface LeanSubCategory {
  _id: string;
  name: string;
  slug: string;
  category: { _id: string; name: string; slug: string; isActive: boolean }[]; // Include all ICategory fields
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await subCategory.countDocuments();
    const subCategories = await subCategory
      .find({})
      .populate({
        path: "category",
        select: "_id name slug isActive",
        model: Category,
      })
      .skip(skip)
      .limit(limit)
      .lean<LeanSubCategory[]>();

    const sanitizedSubCategories: ISubCategory[] = subCategories.map(
      (subCategory) => ({
        id: subCategory._id.toString(),
        name: subCategory.name,
        slug: subCategory.slug,
        category: subCategory.category.map((cat) => cat._id.toString()), // Map to IDs only
        seoTitle: subCategory.seoTitle || "",
        metaDescription: subCategory.metaDescription || "",
        metaKeywords: subCategory.metaKeywords || "",
        isActive: subCategory.isActive,
        createdAt: subCategory.createdAt,
        updatedAt: subCategory.updatedAt,
      })
    );

    const responseData: ApiResponse<{
      categories: ISubCategory[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Subcategory retrieved successfully",
      data: {
        categories: sanitizedSubCategories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Subcategories Error:", error);
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
        message: "Forbidden: Only admins and editors can add subcategories",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    if (body.isActive !== undefined) {
      if (typeof body.isActive === "string") {
        const lowerCaseIsActive = body.isActive.toLowerCase();
        if (lowerCaseIsActive === "true") {
          body.isActive = true;
        } else if (lowerCaseIsActive === "false") {
          body.isActive = false;
        } else {
          body.isActive = undefined;
        }
      } else if (typeof body.isActive != "boolean") {
        body.isActive = undefined;
      }
    }
    if (!validateAddProductSubCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }
    const {
      name,
      slug,
      category,
      seoTitle,
      metaDescription,
      metaKeywords,
      isActive,
    } = body;

    const validCategories = category.map(
      (cat: string) => new mongoose.Types.ObjectId(cat)
    );
    const existingCategories = await Category.find({
      _id: { $in: validCategories },
    }).lean();
    if (existingCategories.length !== validCategories.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more subcategories are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const existingSubCategories = await subCategory.findOne({ slug });
    if (existingSubCategories) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }
    const subCategoryData = {
      name: sanitizeInput(name),
      slug: sanitizeInput(slug),
      category: validCategories,
      seoTitle: sanitizeInput(seoTitle || ""),
      metaDescription: sanitizeInput(metaDescription || ""),
      metaKeywords: sanitizeInput(metaKeywords || ""),
      isActive: isActive ?? true,
    };
    const subCategories = new subCategory(subCategoryData);
    const savedSubCategory = await subCategories.save();

    const responseData: ApiResponse<ISubCategory> = {
      error: false,
      message: "Subcategory added successfully",
      data: savedSubCategory,
    };
    return NextResponse.json(responseData, {
      status: 201,
    });
  } catch (error) {
    console.error("Add Subcategory Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
