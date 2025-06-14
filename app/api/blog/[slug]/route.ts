import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateBlogRequest } from "@/lib/validation";
import { Blog } from "@/models/Blog";
import { ApiResponse, IBlog } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";


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
          message: "Blog slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Blog slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Blog slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const foundBlog = await Blog.findOne({ slug })
      .select("name slug heading category description seoTitle metaDescription metaKeywords image createdAt updatedAt")
      .populate('category', 'name slug')
      .lean<IBlog | null>();

    if (!foundBlog) {
      return NextResponse.json(
        {
          error: true,
          message: "Blog not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<IBlog> = {
      error: false,
      message: "Blog retrieved successfully",
      data: foundBlog,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get Blog Error:", error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid blog format",
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
