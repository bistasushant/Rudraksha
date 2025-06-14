import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// New GET route for fetching users by IDs
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await hasAuth(req);
    if (response) return response;

    // Restrict to admin or editor roles for this endpoint
    const allowedRoles = ["admin", "editor"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Insufficient permissions",
        } as ApiResponse,
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    interface UserQuery {
      email?: string;
      role?: { $in: string[] };
      _id?: { $in: string[] };
    }

    const query: UserQuery = {};
    let users;

    if (ids) {
      // Fetch users by IDs (no role filter to include all users, including admins)
      const idArray = ids.split(",").map((id) => id.trim());
      users = await User.find({ _id: { $in: idArray } })
        .select("email name contactNumber image createdAt updatedAt role")
        .sort({ createdAt: -1 });
    } else if (email) {
      // Fetch by email
      query.email = email;
      query.role = { $in: ["admin", "editor", "user"] };
      users = await User.find(query)
        .select("email name contactNumber image createdAt updatedAt role")
        .limit(1);
    } else {
      // Fetch paginated users
      query.role = { $in: ["admin", "editor", "user"] };
      users = await User.find(query)
        .select("email name contactNumber image createdAt updatedAt role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: true, message: "No profiles found" } as ApiResponse,
        { status: 404 }
      );
    }

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name || "Unknown",
      email: user.email || "N/A",
      contactNumber: user.contactNumber || "",
      image: user.image || "",
      role: user.role || "Unknown",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    if (ids || email) {
      return NextResponse.json({
        error: false,
        message: "User profiles retrieved successfully",
        data: { users: formattedUsers },
      } as ApiResponse);
    }

    const total = await User.countDocuments({
      role: { $in: ["admin", "editor", "user"] },
    });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersCount = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo },
      role: { $in: ["admin", "editor", "user"] },
    });

    return NextResponse.json({
      error: false,
      message: "All profiles retrieved successfully",
      data: { users: formattedUsers },
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      newUsersCount,
    } as ApiResponse);
  } catch (error) {
    console.error("User profiles retrieval error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}