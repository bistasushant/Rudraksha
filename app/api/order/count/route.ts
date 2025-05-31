import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ICheckout } from "@/types";
import { Checkout } from "@/models/Checkout";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await connectDB();

  try {
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

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const query: mongoose.FilterQuery<ICheckout> = { status: "pending" };
    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { error: true, message: "Invalid since date" } as ApiResponse,
          { status: 400 }
        );
      }
      query.createdAt = { $gt: sinceDate };
    }

    const pendingOrdersCount = await Checkout.countDocuments(query);

    const responseData: ApiResponse<{ count: number }> = {
      error: false,
      message: "Pending orders count retrieved successfully",
      data: { count: pendingOrdersCount },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Pending Orders Count Error:", error);
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
