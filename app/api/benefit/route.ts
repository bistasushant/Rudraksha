import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddBenefitRequest } from "@/lib/validation";
import { Benefit } from "@/models/Benefit";
import { ApiResponse, IBenefit } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Benefit.countDocuments();
    const benefits = await Benefit.find({})
      .skip(skip)
      .limit(limit)
      .lean<IBenefit[]>();
    const sanitizedBenefit = benefits.map((benefit) => ({
      id: benefit._id?.toString() || "",
      title: benefit.title,
      slug: benefit.slug,
      description: benefit.description,
      seoTitle: benefit.seoTitle || "",
      metaDescription: benefit.metaDescription || "",
      metaKeywords: benefit.metaKeywords || "",
      createdAt: benefit.createdAt,
      updatedAt: benefit.updatedAt,
    }));

    const responseData: ApiResponse<{
      benefits: IBenefit[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Benefits retrived successfully",
      data: {
        benefits: sanitizedBenefit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Benefit Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
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
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to add benefits",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (!validateAddBenefitRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }
    const {
      title,
      slug,
      description,
      seoTitle,
      metaDescription,
      metaKeywords,
    } = body;

    const existingBenefit = await Benefit.findOne({ slug });
    if (existingBenefit) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    const benefitData = {
      title: sanitizeInput(title),
      slug: sanitizeInput(slug),
      description: sanitizeInput(description),
      seoTitle: seoTitle ? sanitizeInput(seoTitle) : "",
      metaDescription: metaDescription ? sanitizeInput(metaDescription) : "",
      metaKeywords: metaKeywords ? sanitizeInput(metaKeywords) : "",
    };
    const benefits = new Benefit(benefitData);
    const savedBenefit = await benefits.save();

    const responseData: ApiResponse<IBenefit> = {
      error: false,
      message: "Benefit added successfully",
      data: savedBenefit,
    };
    return NextResponse.json(responseData, {
      status: 201,
    });
  } catch (error) {
    console.error("Add Benefit Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
