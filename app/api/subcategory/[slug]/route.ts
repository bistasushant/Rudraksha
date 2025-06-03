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
          message: "Subcategory slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (typeof slug != "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Subcategory slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Subcategory slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      )
    }
    const subCategories = await subCategory
      .findOne({ slug })
      .select("name slug category seoTitle metaDescription metaKeywords isActive createdAt updatedAt")
      .lean<LeanSubCategory | null>();

    if (!subCategories) {
      return NextResponse.json(
        {
          error: true,
          message: "Subcategory not found",
        } as ApiResponse,
        { status: 404 }
      );
    }
    const responseData: ApiResponse<LeanSubCategory> = {
      error: false,
      message: "Subcategory retrieved successfully",
      data: subCategories,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get SubCategory Error:", error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid subcategory format",
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
