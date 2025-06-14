import { comparePassword, hasAuth, hashPassword } from "@/lib/auth";
import { validateChangePasswordRequest, sanitizeInput } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Define MongoDB error interface
interface MongoError extends Error {
  code?: string | number;
}

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    // Check authentication
    const { user, response } = await hasAuth(req);
    if (response) return response;

    // Ensure the user is a customer
    if (user.role !== "customer") {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Customer role required",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const body = await req.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Sanitize inputs
    const sanitizedOldPassword = sanitizeInput(oldPassword);
    const sanitizedNewPassword = sanitizeInput(newPassword);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

    // Basic validation for confirmPassword
    if (sanitizedNewPassword !== sanitizedConfirmPassword) {
      return NextResponse.json(
        {
          error: true,
          message: "New password and confirm password do not match",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate request body
    if (
      !validateChangePasswordRequest(
        {
          oldPassword: sanitizedOldPassword,
          newPassword: sanitizedNewPassword,
          confirmPassword: sanitizedConfirmPassword,
        },
        user.role
      )
    ) {
      return NextResponse.json(
        {
          error: true,
          message:
            "New password must be at least 8 characters with 1 uppercase, 1 special character, 1 lowercase, and 1 number",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Fetch user with password
    const fullCustomer = await User.findById(user._id).select("+password");
    if (!fullCustomer) {
      return NextResponse.json(
        { error: true, message: "Customer not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify old password
    if (!(await comparePassword(sanitizedOldPassword, fullCustomer.password))) {
      return NextResponse.json(
        { error: true, message: "Invalid old password" } as ApiResponse,
        { status: 400 }
      );
    }

    // Update password
    fullCustomer.password = await hashPassword(sanitizedNewPassword);
    await fullCustomer.save();

    // Invalidate existing sessions by clearing authToken cookie
    const apiResponse = NextResponse.json({
      error: false,
      message: "Password changed successfully",
    } as ApiResponse);

    apiResponse.cookies.set("authToken", "", {
      path: "/",
      expires: new Date(0),
      sameSite: "strict",
    });

    return apiResponse;
  } catch (error) {
    console.error("Change password error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific MongoDB errors
    if (
      error instanceof Error &&
      (error as MongoError).code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        { error: true, message: "Database connection failed" } as ApiResponse,
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
