import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { Checkout } from "@/models/Checkout";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Authenticate user
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

    // Ensure user is a customer or admin
    if (user.role !== "customer" && user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only customers and admins can access order stats",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Log user ID

    // Convert user._id to ObjectId
    let customerId;
    try {
      // If admin, use the customerId from query params, otherwise use the logged-in user's ID
      const { searchParams } = new URL(req.url);
      const requestedCustomerId = searchParams.get("customerId");

      if (user.role === "admin" && requestedCustomerId) {
        customerId = new ObjectId(requestedCustomerId);
      } else {
        customerId = new ObjectId(user._id);
      }
    } catch {
      console.error("Invalid customer._id format:", user._id);
      return NextResponse.json(
        {
          error: true,
          message: "Invalid customer ID format",
        } as ApiResponse,
        { status: 400 }
      );
    }


    // Count total orders
    const totalOrders = await Checkout.countDocuments({ customerId });

    // Count pending orders
    const pendingOrders = await Checkout.countDocuments({
      customerId,
      status: "pending",
    });

    // Count delivered orders
    const deliveredOrders = await Checkout.countDocuments({
      customerId,
      status: "delivered",
    });

    // Calculate total spent
    const totalSpentResult = await Checkout.aggregate([
      { $match: { customerId } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: { $ifNull: ["$totalAmount", 0] } } },
        },
      },
    ]);
    const totalSpent = totalSpentResult[0]?.total || 0;

    // Calculate success rate
    const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Build response
    const responseData: ApiResponse<{
      totalOrders: number;
      pendingOrders: number;
      deliveredOrders: number;
      totalSpent: number;
      successRate: number;
      avgOrderValue: number;
    }> = {
      error: false,
      message: "Order stats retrieved successfully",
      data: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalSpent,
        successRate: Number(successRate.toFixed(1)),
        avgOrderValue: Number(avgOrderValue.toFixed(0)),
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Customer Order Stats Error:", error);
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