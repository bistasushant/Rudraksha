import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddTestimonialRequest } from "@/lib/validation";
import { Testimonial } from "@/models/Testimonial";
import { ApiResponse, ITestimonial } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Type for lean Blog document
interface LeanTestimonial {
  _id: string;
  fullName: string;
  slug: string;
  address: string;
  rating: number;
  description: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
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
        message: "Forbidden: You do not have permission to add testimonials",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: true, message: "Invalid JSON format" } as ApiResponse,
        { status: 400 }
      );
    }

    const validationResult = validateAddTestimonialRequest(body, user.role);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: true, message: validationResult.message } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      fullName,
      slug,
      address,
      rating: rawRating,
      description,
      seoTitle,
      metaDescription,
      metaKeywords,
      image,
    } = body;

    // Convert rating to number explicitly
    const rating = typeof rawRating === "string" ? parseInt(rawRating, 10) : rawRating;

    const testimonialSlug =
      slug ||
      fullName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingTestimonial = await Testimonial.findOne({ slug: testimonialSlug });
    if (existingTestimonial) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    const testimonialData = {
      fullName: sanitizeInput(fullName),
      slug: testimonialSlug,
      address: sanitizeInput(address),
      rating: rating,
      description: sanitizeInput(description),
      seoTitle: sanitizeInput(seoTitle || ""),
      metaDescription: sanitizeInput(metaDescription || ""),
      metaKeywords: sanitizeInput(metaKeywords || ""),
      image: image,
    };

    const testimonial = new Testimonial(testimonialData);

    if (!testimonial.slug) {
      testimonial.slug = testimonialSlug;
    }

    const savedTestimonial = await testimonial.save();

    const responseData: ApiResponse<ITestimonial> = {
      error: false,
      message: "Testimonial added successfully",
      data: savedTestimonial.toObject(),
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Testimonial Error:", error);
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
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    // Fetch total count of blogs
    const total = await Testimonial.countDocuments();

    // Fetch blogs with pagination
    const testimonials = await Testimonial.find({})
      .lean<LeanTestimonial[]>()
      .skip(skip)
      .limit(limit);

    // Sanitize and transform blog data
    const sanitizedTestimonial = testimonials.map((testimonial) => {
      // Handle category field
      return {
        id: testimonial._id.toString(),
        fullName: testimonial.fullName,
        slug: testimonial.slug,
        address: testimonial.address,
        rating: testimonial.rating,
        description: testimonial.description,
        seoTitle: testimonial.seoTitle || "",
        metaDescription: testimonial.metaDescription || "",
        metaKeywords: testimonial.metaKeywords || "",
        image: testimonial.image,
        createdAt: testimonial.createdAt,
        updatedAt: testimonial.updatedAt,
      };
    });

    const responseData: ApiResponse<{
      testimonials: ITestimonial[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Testimonials retrieved successfully",
      data: {
        testimonials: sanitizedTestimonial,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
    });
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
