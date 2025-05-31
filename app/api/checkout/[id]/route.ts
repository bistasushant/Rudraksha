import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hasAuth } from "@/lib/auth";
import { Checkout, getCheckoutById } from "@/models/Checkout";
import { ApiResponse, ICheckout } from "@/types";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    await connectDB();
    const { user, response: authResponse } = await hasAuth(request);

    if (!user || authResponse) {
      return (
        authResponse ||
        NextResponse.json(
          { error: true, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: true, message: "Invalid checkout ID format" },
        { status: 400 }
      );
    }

    const checkout = await getCheckoutById(id);
    if (!checkout) {
      return NextResponse.json(
        { error: true, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      message: "Order retrieved successfully",
      data: { checkout },
    });
  } catch (error) {
    console.error("Error fetching checkout:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Inlined context type
) {
  const id = (await params).id;

  try {
    await connectDB();
    const { user, response: authResponse } = await hasAuth(request);

    if (!user || authResponse) {
      return (
        authResponse ||
        NextResponse.json(
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401 }
        )
      );
    }

    // Ensure user.role exists and is a string before checking
    if (!user.role || !["admin"].includes(user.role as string)) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Admin access required",
        } as ApiResponse,
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: true, message: "Invalid checkout ID format" } as ApiResponse,
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: true, message: "Invalid JSON in request body" } as ApiResponse,
        { status: 400 }
      );
    }
    const { status, paymentStatus } = body;

    // Explicitly type the update object
    const update: Partial<Pick<ICheckout, "status" | "paymentStatus">> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (
      status &&
      [
        "pending",
        "confirm",
        "processing",
        "pickup",
        "on the way",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      update.status = status as ICheckout["status"]; // Add type assertion if necessary
    }

    if (paymentStatus && ["paid", "unpaid"].includes(paymentStatus)) {
      update.paymentStatus = paymentStatus as ICheckout["paymentStatus"]; // Add type assertion if necessary
    }

    // Check if only updatedAt is present (meaning no valid fields to update were provided)
    if (Object.keys(update).length === 1 && update.updatedAt) {
      return NextResponse.json(
        {
          error: true,
          message: "No valid fields to update provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const updatedCheckout = await Checkout.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean<ICheckout | null>(); // Use .lean<ICheckout | null>() for better typing with lean

    if (!updatedCheckout) {
      return NextResponse.json(
        { error: true, message: "Checkout not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse = {
      error: false,
      message: "Order updated successfully",
      data: { checkout: updatedCheckout },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Update Checkout Error:", error);
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

export async function DELETE(req: NextRequest) {
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
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: true, message: "Forbidden: Only admins can delete orders" } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();
    if (!id) {
      return NextResponse.json(
        { error: true, message: "Invalid checkout ID format" } as ApiResponse,
        { status: 400 }
      );
    }
    const deletedCheckout = await Checkout.findByIdAndDelete(id);
    if (!deletedCheckout) {
      return NextResponse.json(
        { error: true, message: "Checkout not found" } as ApiResponse,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: false, message: "Checkout deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Checkout Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}



