import { comparePassword, hasAuth, hashPassword } from "@/lib/auth";
import { validateChangePasswordRequest } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const { user, response } = await hasAuth(req);
    if (response) return response;

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    // Validate request
    if (
      !validateChangePasswordRequest({ oldPassword, newPassword }, user.role)
    ) {
      return NextResponse.json(
        {
          error: true,
          message:
            user.role === "customer"
              ? "New password must be at least 6 characters"
              : "New password must be at least 8 characters with 1 uppercase, 1 special character, 1 lowercase, and 1 number",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Fetch user with password
    const fullUser = await User.findById(user._id).select("+password");
    if (!fullUser) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify old password
    if (!(await comparePassword(oldPassword, fullUser.password))) {
      return NextResponse.json(
        { error: true, message: "Invalid old password" } as ApiResponse,
        { status: 400 }
      );
    }

    // Update password
    fullUser.password = await hashPassword(newPassword);
    await fullUser.save();

    // Invalidate existing sessions (optional: implement session management)
    // For simplicity, require re-login by clearing authToken cookie
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
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
