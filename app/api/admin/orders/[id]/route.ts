import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ICheckout } from "@/types";
import { Checkout } from "@/models/Checkout";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
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

    // Ensure user is an admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only admins can access order details",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Get order ID from params
    const { id: orderId } = await params;

    // Validate order ID format
    let orderObjectId;
    try {
      orderObjectId = new ObjectId(orderId);
    } catch {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid order ID format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Find the specific order
    const order = await Checkout.findOne({ _id: orderObjectId }).lean() as unknown as ICheckout;

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
      customerDetails: {
        name: order.shippingDetails.fullName || '',
        email: order.shippingDetails.email || '',
        phone: order.shippingDetails.phone || '',
        address: order.shippingDetails.address || '',
        countryId: order.shippingDetails.countryId || '',
        provinceId: order.shippingDetails.provinceId || '',
        cityId: order.shippingDetails.cityId || '',
        postalCode: order.shippingDetails.postalCode || '',
        locationUrl: order.shippingDetails.locationUrl || '',
      },
      paymentDetails: {
        method: order.paymentMethod || '',
        status: order.paymentStatus || '',
      },
      subtotal: order.subtotal || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json({
      error: false,
      message: "Order details retrieved successfully",
      data: { order: formattedOrder },
    } as ApiResponse, { status: 200 });

  } catch (error) {
    console.error("Get Order Details Error:", error);
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