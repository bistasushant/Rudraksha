import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { validateAddSizeRequest } from "@/lib/validation";
import { productSize } from "@/models/ProductSize";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";


interface SizeResponse {
    id: string;
    size: string;
    isActive: boolean;
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

    const total = await productSize.countDocuments();
    const productSizes = await productSize
      .find({})
      .skip(skip)
      .limit(limit)
      .lean();

    const sanitizeProductSizes = productSizes.map((size) => ({
      id: size._id?.toString() ?? '',
      size: size.size ?? '',
      isActive: size.isActive ?? true,
      createdAt: size.createdAt,
      updatedAt: size.updatedAt,
    }));

    const responseData: ApiResponse<{
      productSizes: SizeResponse[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Product sizes retrieved successfully",
      data: {
        productSizes: sanitizeProductSizes,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Product Sizes Error:", error);
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
          message: "Forbidden: Only admins and editors can add product sizes",
        } as ApiResponse,
        { status: 403 }
      );
    }

    try {
        const body = await req.json();
        if(!validateAddSizeRequest(body, user.role)) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Invalid product size data provided",
                    details: "Please provide valid size, price, and isActive fields"
                } as ApiResponse,
                { status: 400 }
            );
        }

        const { size, isActive } = body;

        const existingSize = await productSize.findOne({ size: size.trim() });
        if (existingSize) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Size already exists",
                    details: "A product size with this name already exists"
                } as ApiResponse,
                { status: 400 }
            );
        }

        let booleanIsActive = true;
        if (typeof isActive === 'string') {
            booleanIsActive = (isActive as string).toLowerCase() === 'true';
        } else if (typeof isActive === 'boolean') {
            booleanIsActive = isActive;
        }

        const newSize = await productSize.create({
            size: size.trim(),
            isActive: booleanIsActive
        });

        return NextResponse.json(
            {
                error: false,
                message: "Product Size added successfully",
                data: {
                    id: newSize._id.toString(),
                    size: newSize.size,
                    isActive: newSize.isActive,
                    createdAt: newSize.createdAt,
                    updatedAt: newSize.updatedAt
                }
            } as ApiResponse,
            { status: 201 }
        );
    } catch (error) {
        console.error("Add Product Size Error:", error);
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