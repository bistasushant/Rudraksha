import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Products";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { Document } from "mongoose";

interface ProductDocument extends Document {
  _id: string;
  name: string;
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

  try {
    const { productIds } = await req.json();

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product IDs format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const products = await Product.find(
      { _id: { $in: productIds } },
      { _id: 1, name: 1 }
    ).lean();

    const productNames: Record<string, string> = {};
    for (const product of products) {
      const id = product._id?.toString();
      const name = (product as unknown as ProductDocument).name;
      if (id && name) {
        productNames[id] = name;
      }
    }

    return NextResponse.json(productNames, { status: 200 });
  } catch (error) {
    console.error("Get Product Names Error:", error);
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