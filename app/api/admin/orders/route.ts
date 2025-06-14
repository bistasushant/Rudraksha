import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ICheckout } from "@/types";
import { Checkout } from "@/models/Checkout";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();//100ms

    // Authenticate user
    const { user, response } = await hasAuth(req); //
    if (!user || response) {
      return (
        response ||
        NextResponse.json(
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401 }
        )
      );
    }

    // Ensure user is an admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only admins can access orders",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Get query parameters for search and status filter
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase() || "";

    // Build query - only get orders placed by this admin
    const query: { _id?: ObjectId; status?: string; customerId: string } = {
      customerId: user._id.toString() // Only get orders placed by this admin
    };

    // If search query is provided, try to use it as an order ID
    if (searchQuery) {
      try {
        query._id = new ObjectId(searchQuery);
      } catch {
        return NextResponse.json(
          {
            error: false,
            message: "No orders found",
            data: { orders: [] },
          } as ApiResponse,
          { status: 200 }
        );
      }
    }

    if (statusFilter && statusFilter !== "all") {
      // Map frontend status values to database values
      const statusMap: { [key: string]: string } = {
        pending: "pending",
        confirm: "confirm",
        processing: "processing",
        pickup: "pickup",
        ontheway: "on the way",
        delivered: "delivered",
      };
      query.status = statusMap[statusFilter] || statusFilter;
    }

    // Fetch orders
    const orders = await Checkout.find(query)
      .select("_id createdAt itemsCount totalAmount status")
      .sort({ createdAt: -1 })
      .lean();

    // Format orders
    const formattedOrders = orders
      .filter((order) => {
        const isValid =
          order._id &&
          order.createdAt &&
          typeof order.totalAmount === "number" &&
          order.status;
        if (!isValid) {
          console.warn("Invalid order document:", order);
        }
        return isValid;
      })
      .map((order: Partial<ICheckout>) => ({
        id: order._id?.toString() || '',
        date: new Date(order.createdAt || new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        items: order.itemsCount || 0,
        total: `$${parseFloat((order.totalAmount || 0).toString()).toFixed(2)}`,
        status: (order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1),
        statusCode: getStatusCode(order.status || 'pending'),
      }));

    return NextResponse.json({
      error: false,
      message: "Orders retrieved successfully",
      data: { orders: formattedOrders },
    } as ApiResponse, { status: 200 });

  } catch (error) {
    console.error("Get Orders Error:", error);
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

// Helper function to get status code for progress bar
function getStatusCode(status: string): number {
  const statusMap: { [key: string]: number } = {
    'pending': 0,
    'confirm': 20,
    'processing': 40,
    'pickup': 60,
    'on the way': 80,
    'delivered': 100
  };

  return statusMap[status.toLowerCase()] || 0;
} 