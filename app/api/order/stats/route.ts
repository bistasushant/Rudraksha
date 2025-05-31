import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { Checkout } from "@/models/Checkout";

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

    // Calculate date ranges
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Count total orders
    const totalOrders = await Checkout.countDocuments();

    // Count orders for the current month
    const currentMonthOrders = await Checkout.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
    });

    // Count orders for the previous month
    const previousMonthOrders = await Checkout.countDocuments({
      createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
    });

    // Calculate percentage change
    let percentageChange = 0;
    if (previousMonthOrders > 0) {
      percentageChange =
        ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) *
        100;
    } else if (currentMonthOrders > 0) {
      percentageChange = 100; // If no orders last month, treat as 100% increase
    }
    // Round to 1 decimal place
    percentageChange = Math.round(percentageChange * 10) / 10;

    const responseData: ApiResponse<{
      totalOrders: number;
      percentageChange: number;
    }> = {
      error: false,
      message: "Orders stats retrieved successfully",
      data: {
        totalOrders,
        percentageChange,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Orders Stats Error:", error);
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
