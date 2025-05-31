import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateBlogRequest } from "@/lib/validation";
import { Blog } from "@/models/Blog";
import { ApiResponse, IBlog } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Type for lean Blog document
interface LeanBlog {
  _id: string;
  name: string;
  slug: string;
  heading: string;
  category: mongoose.Types.ObjectId[];
  description: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image?: string;
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
        message: "Forbidden: You do not have permission to update blogs",
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

    if (!validateUpdateBlogRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      name,
      heading,
      category,
      description,
      seoTitle,
      metaDescription,
      metaKeywords,
      image,
      slug: newSlug,
    } = body;

    const updateData: Partial<IBlog> = {};

    if (name) updateData.name = sanitizeInput(name);
    if (heading) updateData.heading = sanitizeInput(heading);
    if (Array.isArray(category)) {
      updateData.category = category.map((cat) => sanitizeInput(cat));
    }
    if (description) updateData.description = sanitizeInput(description);
    if (seoTitle) updateData.seoTitle = sanitizeInput(seoTitle);
    if (metaDescription)
      updateData.metaDescription = sanitizeInput(metaDescription);
    if (metaKeywords) updateData.metaKeywords = sanitizeInput(metaKeywords);
    if (image) updateData.image = sanitizeInput(image);
    if (newSlug) {
      if (newSlug !== slug) {
        const existingBlog = await Blog.findOne({ slug: newSlug });
        if (existingBlog) {
          return NextResponse.json(
            { error: true, message: "New slug already in use" } as ApiResponse,
            { status: 400 }
          );
        }
      }
      updateData.slug = sanitizeInput(newSlug);
    }
    const updatedBlog = await Blog.findOneAndUpdate({ slug }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return NextResponse.json(
        { error: true, message: "Blog not found" } as ApiResponse,
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Blog updated successfully",
        data: updatedBlog.toObject(),
      } as ApiResponse<IBlog>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Blog Error:", error);
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
        message: "Forbidden: You do not have permission to delete blogs",
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
    const deletedBlog = await Blog.findOneAndDelete({ slug });

    if (!deletedBlog) {
      return NextResponse.json(
        { error: true, message: "Blog not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Blog deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Blog Error:", error);
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

export async function GET(req: NextRequest) {
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

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Blog.countDocuments();
    const blogs = await Blog.find({})
      .lean<LeanBlog[]>()
      .skip(skip)
      .limit(limit);
    const sanitizedBlog = blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      slug: blog.slug,
      heading: blog.heading,
      category: blog.category.map((cat) => cat.toString()),
      description: blog.description,
      seoTitle: blog.seoTitle || "",
      metaDescription: blog.metaDescription || "",
      metaKeywords: blog.metaKeywords || "",
      image: blog.image || "",
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    }));

    const responseData: ApiResponse<{
      blogs: IBlog[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Blogs retrieved successfully",
      data: {
        blogs: sanitizedBlog,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Blogs Error:", error);
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
