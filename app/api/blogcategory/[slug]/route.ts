import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateUpdateBlogCategoryRequest,
} from "@/lib/validation";
import { blogCategory } from "@/models/BlogCategory";
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
