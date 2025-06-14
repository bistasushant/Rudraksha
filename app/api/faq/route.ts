import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddFaqRequest } from "@/lib/validation";
import { Faq } from "@/models/Faq";
import { ApiResponse, IFaq } from "@/types";
import { NextRequest, NextResponse } from "next/server";

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
        message: "Forbidden: You do not have permission to add FAQs",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const body = await req.json(); // ✅ Use json() instead of text() + parse()

    // If you're sending a plain object, remove `.data`
    if (!validateAddFaqRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      question,
      slug,
      answer,
      seoTitle,
      metaDescription,
      metaKeywords,
    } = body;

    const existingFaq = await Faq.findOne({ slug, type: "faq" });
    if (existingFaq) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    const faqData = {
      type: "faq",
      question: sanitizeInput(question),
      slug: sanitizeInput(slug),
      answer: sanitizeInput(answer),
      seoTitle: seoTitle ? sanitizeInput(seoTitle) : undefined,
      metaDescription: metaDescription ? sanitizeInput(metaDescription) : undefined,
      metaKeywords: metaKeywords ? sanitizeInput(metaKeywords) : undefined,
    };

    const newFaq = new Faq(faqData);
    const savedFaq = await newFaq.save();

    const responseData: ApiResponse<IFaq> = {
      error: false,
      message: "FAQ added successfully",
      data: savedFaq,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Faq Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Faq.countDocuments();
    const faqs = await Faq.find({}).skip(skip).limit(limit).lean<IFaq[]>();
    const sanitizedFaq = faqs.map((faq) => ({
      id: faq._id?.toString() || "",
      type: faq.type,
      question: faq.question,
      slug: faq.slug,
      answer: faq.answer,
      seoTitle: faq.seoTitle || "",
      metaDescription: faq.metaDescription || "",
      metaKeywords: faq.metaKeywords || "",
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    }));

    const responseData: ApiResponse<{
      faqs: IFaq[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "FAQs retrieved successfully",
      data: {
        faqs: sanitizedFaq,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get FAQ Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
