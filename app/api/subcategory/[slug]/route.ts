import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateUpdateSubCategoryRequest,
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
        message: "Forbidden: Only admins and editors can update subcategories",
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

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
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
      } else if (typeof body.isActive !== "boolean") {
        body.isActive = undefined;
      }
    }

    const isActive: boolean | undefined = body.isActive;

    if (!validateUpdateSubCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, category, seoTitle, metaDescription, metaKeywords } = body;

    const updateData: Partial<ISubCategory> = {};

    if (name) updateData.name = sanitizeInput(name);
    if (Array.isArray(category)) {
      // Validate category IDs
      const validCategoryIds = category.map(
        (cat) => new mongoose.Types.ObjectId(cat)
      );
      const existingCategories = await Category.find({
        _id: { $in: validCategoryIds },
      }).lean();

      if (existingCategories.length !== validCategoryIds.length) {
        return NextResponse.json(
          {
            error: true,
            message: "One or more categories are invalid",
          } as ApiResponse,
          { status: 400 }
        );
      }

      // Assign array of category IDs
      updateData.category = validCategoryIds;
    }
    if (seoTitle) updateData.seoTitle = sanitizeInput(seoTitle);
    if (metaDescription)
      updateData.metaDescription = sanitizeInput(metaDescription);
    if (metaKeywords) updateData.metaKeywords = sanitizeInput(metaKeywords);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Find and update the subcategory
    const updatedSubCategory = await subCategory
      .findOneAndUpdate({ slug }, updateData, {
        new: true,
        runValidators: true,
      })
      .lean();

    if (!updatedSubCategory) {
      return NextResponse.json(
        { error: true, message: "Subcategory not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Subcategory updated successfully",
        data: updatedSubCategory,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { error: true, message: "Failed to update subcategory" } as ApiResponse,
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
        { error: true, message: "unauthorized" } as ApiResponse,
        { status: 401 }
      )
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only admins can delete subcategories",
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
    const deletedSubCategory = await subCategory.findOneAndDelete({ slug });
    if (!deletedSubCategory) {
      return NextResponse.json(
        { error: true, message: "Subcategory not found" } as ApiResponse,
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Subcategory deleted successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Subcategory Error:", error);
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
