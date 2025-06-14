import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateUpdateBlogCategoryRequest,
} from "@/lib/validation";
import { blogCategory } from "@/models/BlogCategory";
import { ApiResponse, IBlogcategory } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message:
          "Forbidden: You do not have permission to update blog categories",
      },
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" },
        { status: 400 }
      );
    }
    const body = await req.json();

    if (!validateUpdateBlogCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" },
        { status: 400 }
      );
    }
    const { name, seoTitle, metaDescription, metaKeywords } = body;

    const updatedBlogCategory = await blogCategory.findOneAndUpdate(
      { slug },
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(seoTitle && { seoTitle: sanitizeInput(seoTitle) }),
        ...(metaDescription && {
          metaDescription: sanitizeInput(metaDescription),
        }),
        ...(metaKeywords && { metaKeywords: sanitizeInput(metaKeywords) }),
      },
      { new: true }
    );
    if (!updatedBlogCategory) {
      return NextResponse.json(
        { error: true, message: "Blog category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Blog category updated successfully",
        data: updatedBlogCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Blog Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
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
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message:
          "Forbidden: You do not have permission to delete blog categories",
      },
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" },
        { status: 400 }
      );
    }
    const deleteBlogCategory = await blogCategory.findOneAndDelete({ slug });
    if (!deleteBlogCategory) {
      return NextResponse.json(
        { error: true, message: "Blog category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: false, message: "Blog category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Blog Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
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
          message: "Blog category slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Blog category slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Blog category slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const foundBlogCategory = await blogCategory.findOne({ slug })
      .select("name slug seoTitle metaDescription metaKeywords createdAt updatedAt")
      .lean<IBlogcategory | null>();

    if (!foundBlogCategory) {
      return NextResponse.json(
        {
          error: true,
          message: "Blog category not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<IBlogcategory> = {
      error: false,
      message: "Blog category retrieved successfully",
      data: foundBlogCategory,
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
          message: "Invalid blog category format",
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
