import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateTestimonialRequest } from "@/lib/validation";
import { Testimonial } from "@/models/Testimonial";
import { ApiResponse, ITestimonial } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface LeanTestimonial {
  _id: string;
  id: string;
  fullName: string;
  slug: string;
  address: string;
  rating: number;
  description: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string;
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
        message: "Forbidden: You do not have permission to update testimonials",
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

    if (!validateUpdateTestimonialRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      fullName,
      address,
      rating,
      description,
      seoTitle,
      metaDescription,
      metaKeywords,
      image,
      slug: newSlug,
    } = body;

    const updateData: Partial<ITestimonial> = {};

    if (fullName) updateData.fullName = sanitizeInput(fullName);
    if (address) updateData.address = sanitizeInput(address);
    if (rating) updateData.rating = rating;

    if (description) updateData.description = sanitizeInput(description);
    if (seoTitle) updateData.seoTitle = sanitizeInput(seoTitle);
    if (metaDescription)
      updateData.metaDescription = sanitizeInput(metaDescription);
    if (metaKeywords) updateData.metaKeywords = sanitizeInput(metaKeywords);
    if (image) updateData.image = sanitizeInput(image);
    if (newSlug) {
      if (newSlug !== slug) {
        const existingTestimonial = await Testimonial.findOne({ slug: newSlug });
        if (existingTestimonial) {
          return NextResponse.json(
            { error: true, message: "New slug already in use" } as ApiResponse,
            { status: 400 }
          );
        }
      }
      updateData.slug = sanitizeInput(newSlug);
    }
    const updatedTestimonial = await Testimonial.findOneAndUpdate({ slug }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTestimonial) {
      return NextResponse.json(
        { error: true, message: "Testimonial not found" } as ApiResponse,
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Testimonial updated successfully",
        data: updatedTestimonial.toObject(),
      } as ApiResponse<ITestimonial>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Testimonial Error:", error);
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
        message: "Forbidden: You do not have permission to delete testimonials",
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
    const deletedTestimonial = await Testimonial.findOneAndDelete({ slug });

    if (!deletedTestimonial) {
      return NextResponse.json(
        { error: true, message: "Testimonial not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Testimonial deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Testimonial Error:", error);
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
          message: "Testimonial slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Testimonial slug must be a string",
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
    const foundTestimonials = await Testimonial.findOne({ slug })
      .select("fullName slug address rating description seoTitle metaDescription metaKeywords image createdAt updatedAt")
      .lean<LeanTestimonial | null>()

    if (!foundTestimonials) {
      return NextResponse.json(
        {
          error: true,
          message: "Testimonial not found",
        } as ApiResponse,
        { status: 404 }
      );
    }
    const responseData: ApiResponse<ITestimonial> = {
      error: false,
      message: "Testimonial retrieved successfully",
      data: foundTestimonials,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get Testimonial Error:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid testimonial format",
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
