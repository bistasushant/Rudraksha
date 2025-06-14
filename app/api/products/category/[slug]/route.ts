import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { Category } from "@/models/Category";
import { Product } from "@/models/Products";
import { subCategory } from "@/models/SubCategory";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectDB();

  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.length > 100) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid category slug",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Find category by slug
    const category = await Category.findOne({ slug })
      .select("_id name slug image description benefit")
      .lean() as { _id: mongoose.Types.ObjectId; name: string; slug: string; image?: string; description?: string; benefit?: string; } | null;

    if (!category) {
      return NextResponse.json(
        {
          error: true,
          message: "Category not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Find products with that category
    const products = await Product.find({ category: category._id })
      .populate({
        path: "subcategory",
        model: subCategory,
        select: "name slug", // Select relevant fields
      })
      .select("name slug price stock images description benefit category subcategory createdAt updatedAt")
      .lean();

    const responseData: ApiResponse<{ category: typeof category; products: typeof products }> = {
      error: false,
      message: "Category and products fetched successfully",
      data: {
        category,
        products
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });

  } catch (error) {
    console.error("Get Products by Category Error:", error);

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
