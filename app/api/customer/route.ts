import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  image: string | null;
}

interface GetUsersResponseData {
  users: UserProfile[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { user, response } = await hasAuth(req);
    if (response) return response;

    // Allow only admin, editor, and user roles
    const allowedRoles = ["admin", "editor", "user"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Insufficient permissions",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Parse pagination query params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10"))
    );
    const skip = (page - 1) * limit;

    // Fetch paginated customers
    const users = await User.find({ role: "customer" })
      .select("email name contactNumber image createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // No users found
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: true, message: "No customer found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Format user data
    const formattedUsers: UserProfile[] = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber || null,
      image: user.image || null,
    }));

    // Total customers count
    const total = await User.countDocuments({ role: "customer" });

    // Response object
    const responseData: ApiResponse<GetUsersResponseData> = {
      error: false,
      message: "Customers retrieved successfully",
      data: {
        users: formattedUsers,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Customer retrieval error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle MongoDB connection errors
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        { error: true, message: "Database connection failed" } as ApiResponse,
        { status: 503 }
      );
    }

    // General server error
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
