import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { validateAddDesignRequest } from "@/lib/validation";
import { productDesign } from "@/models/ProductDesign";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

interface DesignResponse {
  id: string;
  title: string;
  image: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await productDesign.countDocuments();
    const productDesigns = await productDesign
      .find({})
      .skip(skip)
      .limit(limit)
      .lean();

    const sanitizedProductDesigns = productDesigns.map((design) => ({
      id: design._id?.toString() ?? '',
      title: design.title,
      image: design.image,
      price: design.price,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    }));
    const responseData: ApiResponse<{
      productDesigns: DesignResponse[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Product Design retrieved successfully",
      data: {
        productDesigns: sanitizedProductDesigns,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Product Designs Error:", error);
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
        message: "Forbidden: Only admins and editors can add product designs",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (!validateAddDesignRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product design data provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { title, image, price } = body;
 
    const existingDesign = await productDesign.findOne({ title: title.trim() });

    if(existingDesign) {
      return NextResponse.json(
        {
          error: true,
          message: "Design already exists",
          details: "A product design with this name already exists"
        } as ApiResponse,
        { status: 400 }
      );
    }
    const numericPrice = typeof price === 'string' ? Number(price) : price;

    // Check if max 5 designs already exist
    const existingDesignsCount = await productDesign.countDocuments();
    if (existingDesignsCount >= 5) {
      return NextResponse.json(
        {
          error: true,
          message: "Maximum of 5 designs allowed per product",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Save new design
    const newDesign = await productDesign.create({
      title: title.trim(),
      price: numericPrice,
      image,
    });

    return NextResponse.json(
      {
        error: false,
        message: "Product design added successfully",
        data: newDesign,
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Add Product Design Error:", error);
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

