import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User"; // Use User model
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth"; // Correct import
import { sanitizeInput } from "@/lib/validation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function DELETE(req: NextRequest) {
  await connectDB();
  try {
    const { user, response } = await hasAuth(req);

    if (response) {
      return response;
    }

    // Ensure user is an admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only admins can delete customers",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Extract and validate customer ID from URL
    const pathname = req.nextUrl.pathname;
    const customerId = sanitizeInput(pathname.split("/").pop() || "");

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid or missing customer ID",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(customerId);

    if (!deletedUser) {
      return NextResponse.json(
        { error: true, message: "customer not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "customer deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete User Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific MongoDB errors
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        { error: true, message: "Database connection failed" } as ApiResponse,
        { status: 503 }
      );
    }

    // Generic server error (avoid leaking details)
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
