import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ICheckout } from "@/types";
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

    // Ensure user is a customer
    if (user.role !== "customer") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only customers can access order history",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Get query parameters for search and status filter
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase() || "";
    const orderId = searchParams.get("orderId")?.trim() || "";

    // Convert user._id to ObjectId
    let customerId;
    try {
      customerId = new ObjectId(user._id);
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

    // Build query
    const query: { customerId: ObjectId; _id?: ObjectId; status?: string } = { customerId };

    // If orderId is provided, fetch specific order
    if (orderId) {
      try {
        query._id = new ObjectId(orderId);
      } catch {
        return NextResponse.json(
          {
            error: true,
            message: "Invalid order ID format",
          } as ApiResponse,
          { status: 400 }
        );
      }
    } else if (searchQuery) {
      // Otherwise use search query if provided
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

    // Determine if this is a single order lookup or order history
    const isSingleOrder = !!orderId;

    if (isSingleOrder) {
      // Fetch single order with full details
      const order = await Checkout.findOne(query).lean() as unknown as ICheckout;

      if (!order) {
        return NextResponse.json(
          {
            error: true,
            message: "Order not found",
          } as ApiResponse,
          { status: 404 }
        );
      }

      // Format the order with all necessary details
      const formattedOrder = {
        id: order._id?.toString() || '',
        date: new Date(order.createdAt || new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        status: (order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1),
        statusCode: getStatusCode(order.status || 'pending'),
        shipping: order.shipping || 0,
        totalAmount: order.totalAmount || 0,
        itemsCount: order.itemsCount || 0,
        items: order.items || [],
        estimatedDelivery: getEstimatedDelivery(order.status || 'pending'),
        // Add other order details as needed
      };

      return NextResponse.json({
        error: false,
        message: "Order details retrieved successfully",
        data: { order: formattedOrder },
      } as ApiResponse, { status: 200 });

    } else {
      // Fetch orders for history list
      const orders = await Checkout.find(query)
        .select("_id createdAt itemsCount totalAmount status")
        .lean();

      // Filter out invalid documents and format orders
      const formattedOrders = orders
        .filter((order) => {
          const isValid =
            order._id && // Check _id exists (ObjectId or string)
            order.createdAt &&
            typeof order.totalAmount === "number" &&
            order.status;
          if (!isValid) {
            console.warn("Invalid order document:", order);
          }
          return isValid;
        })
        .map((order: Partial<ICheckout>) => ({
          id: order._id?.toString() || '', // Convert ObjectId to string
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

      const responseData: ApiResponse<{
        orders: typeof formattedOrders;
      }> = {
        error: false,
        message: "Order history retrieved successfully",
        data: { orders: formattedOrders },
      };

      return NextResponse.json(responseData, { status: 200 });
    }
  } catch (error) {
    console.error("Get Order History Error:", error);
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

// Helper function to get estimated delivery based on status
function getEstimatedDelivery(status: string): string {
  const today = new Date();

  // Calculate estimated delivery date based on current status
  let daysToAdd = 5; // Default for pending

  switch (status.toLowerCase()) {
    case 'confirm':
      daysToAdd = 4;
      break;
    case 'processing':
      daysToAdd = 3;
      break;
    case 'pickup':
      daysToAdd = 2;
      break;
    case 'on the way':
      daysToAdd = 1;
      break;
    case 'delivered':
      daysToAdd = 0;
      break;
  }

  const estimatedDate = new Date(today);
  estimatedDate.setDate(today.getDate() + daysToAdd);

  return estimatedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}