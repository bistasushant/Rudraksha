import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateBenefitRequest } from "@/lib/validation";
import { Benefit } from "@/models/Benefit";
import { ApiResponse, IBenefit } from "@/types";
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
        message: "Forbidden: Tou do not have permission to add benefits",
      } as ApiResponse,
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

    if (!validateUpdateBenefitRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" },
        { status: 400 }
      );
    }
    const { title, description, seoTitle, metaDescription, metaKeywords } = body;

    const updatedBenefit = await Benefit.findOneAndUpdate(
      { slug },
      {
        ...(title && { title: sanitizeInput(title) }),
        ...(description && { description: sanitizeInput(description) }),
        ...(seoTitle && { seoTitle: sanitizeInput(seoTitle) }),
        ...(metaDescription && {
          metaDescription: sanitizeInput(metaDescription),
        }),
        ...(metaKeywords && { metaKeywords: sanitizeInput(metaKeywords) }),
      },
      { new: true }
    );
    if (!updatedBenefit) {
      return NextResponse.json(
        { error: true, message: "Benefit not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Benefit updated successfully",
        data: updatedBenefit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Benefit Error:", error);
    return NextResponse.json(
      {
        error: true,
        messge: "Internal server error",
      },
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
          "Forbidden: You do not have permission to delete benefit",
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
    const deleteBenefit = await Benefit.findOneAndDelete({ slug });
    if (!deleteBenefit) {
      return NextResponse.json(
        { error: true, message: "Benefit not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: false, message: "Benefit deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Benefit Error:", error);
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
          message: "Benefit slug is required",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (typeof slug !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "Benefit slug must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Benefit slug too long (max 100 characters)",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const benefit = await Benefit.findOne({ slug })
      .select(
        "title slug description seoTitle metaDescription metaKeywords createdAt updatedAt"
      )
      .lean<IBenefit | null>();

    if (!benefit) {
      return NextResponse.json(
        {
          error: true,
          message: "Benefit not found",
        } as ApiResponse,
        { status: 404 }
      );
    }
    const responseData: ApiResponse<IBenefit> = {
      error: false,
      message: "Benefit retrieved successfully",
      data: benefit,
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Benefit Error:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid Benefit format",
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