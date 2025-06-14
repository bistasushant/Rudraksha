import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse, UserRole } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Define the interface for updateData
interface UserUpdateData {
  name?: string;
  email?: string;
  contactNumber?: string;
  role?: UserRole;
}

export async function PATCH(req: NextRequest) {
  try {
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
        {
          error: true,
          message: "Forbidden: Only admins can update users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const userId = req.nextUrl.pathname.split("/").pop();
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User ID not found in URL" } as ApiResponse,
        { status: 400 }
      );
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }
    if (existingUser.role === "customer") {
      return NextResponse.json(
        {
          error: true,
          message:
            "Cannot update customers via this route. Use /api/customer/[id]",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, contactNumber, role } = body;

    // Validate inputs
    if (!name && !email && contactNumber === undefined && !role) {
      return NextResponse.json(
        {
          error: true,
          message:
            "At least one field (name, email, contactNumber, role) must be provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const updateData: UserUpdateData = {}; // Use the new interface
    if (name) updateData.name = name.trim();
    if (email) {
      const sanitizedEmail = email.trim().toLowerCase();
      const emailExists = await User.findOne({
        email: sanitizedEmail,
        _id: { $ne: userId },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: true, message: "Email already exists" } as ApiResponse,
          { status: 409 }
        );
      }
      updateData.email = sanitizedEmail;
    }
    if (contactNumber !== undefined)
      updateData.contactNumber = contactNumber.trim();
    if (role) {
      const validRoles: UserRole[] = ["admin", "editor", "user", "customer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: true, message: "Invalid role" } as ApiResponse,
          { status: 400 }
        );
      }
      if (
        role === "customer" &&
        !contactNumber &&
        !existingUser.contactNumber
      ) {
        return NextResponse.json(
          {
            error: true,
            message: "Contact number is required for customer role",
          } as ApiResponse,
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "name email contactNumber role createdAt updatedAt",
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      message: "User updated successfully",
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber || "",
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Update User Error:", error);
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

// DELETE handler remains unchanged
export async function DELETE(req: NextRequest) {
  try {
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
        {
          error: true,
          message: "Forbidden: Only admins can delete users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    const userId = req.nextUrl.pathname.split("/").pop();
    if (!userId) {
      return NextResponse.json(
        { error: true, message: "User ID not found in URL" } as ApiResponse,
        { status: 400 }
      );
    }

    const deletedUser = await User.findById(userId);
    if (!deletedUser) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }
    if (deletedUser.role === "customer") {
      return NextResponse.json(
        {
          error: true,
          message:
            "Cannot delete customers via this route. Use /api/customer/[id]",
        } as ApiResponse,
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { error: false, message: "User deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete User Error:", error);
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: true,
          message: "User ID is required and must be a string",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const user = await User.findById(id).select(
      "name email contactNumber role createdAt updatedAt"
    );

    if (!user) {
      return NextResponse.json(
        {
          error: true,
          message: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "User fetched successfully",
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber || null,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch User Error:", error);
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

