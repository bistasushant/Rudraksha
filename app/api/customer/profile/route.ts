import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User"; // Use User model instead of Customer
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth"; // Use hasAuth from auth utilities
import { sanitizeInput } from "@/lib/validation"; // For email sanitization

// Define the expected structure of the user profile response
interface UserProfileResponseData {
  email: string;
  name: string;
  role: string;
  image?: string | null;
  contactNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define MongoDB error interface
interface MongoError extends Error {
  code?: string | number;
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    // Verify authentication and get user data
    const { user, response } = await hasAuth(req);

    // Return early if authentication failed (e.g., unauthorized)
    if (response) {
      return response;
    }

    // Validate and sanitize user email
    if (!user?.email) {
      return NextResponse.json(
        { error: true, message: "Invalid user data" } as ApiResponse,
        { status: 400 }
      );
    }
    const sanitizedEmail = sanitizeInput(user.email);

    // Find user profile by email (no need to call connectDB again, as hasAuth does it)
    const userProfile = await User.findOne({
      email: sanitizedEmail,
    }).select("email name role image contactNumber createdAt updatedAt -_id");

    if (!userProfile) {
      return NextResponse.json(
        { error: true, message: "User profile not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Ensure the user is a customer (role check)
    if (userProfile.role !== "customer") {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Customer role required",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Prepare response data with explicit field mapping
    const responseData: ApiResponse<UserProfileResponseData> = {
      error: false,
      message: "User profile retrieved successfully",
      data: {
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        image: userProfile.image || null,
        contactNumber: userProfile.contactNumber || null, // Adjust if phone is not in schema
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error retrieving user profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

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


export async function POST(req: NextRequest) {
  await connectDB();
  try {
    // Verify authentication and get user data
    const { user, response } = await hasAuth(req);

    // Return early if authentication failed (e.g., unauthorized)
    if (response) {
      return response;
    }

    // Validate and sanitize user email
    if (!user?.email) {
      return NextResponse.json(
        { error: true, message: "Invalid user data" } as ApiResponse,
        { status: 400 }
      );
    }
    const sanitizedEmail = sanitizeInput(user.email);

    // Ensure the user is a customer (role check)
    const userProfile = await User.findOne({ email: sanitizedEmail }).select("role");
    if (!userProfile) {
      return NextResponse.json(
        { error: true, message: "User profile not found" } as ApiResponse,
        { status: 404 }
      );
    }
    if (userProfile.role !== "customer") {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Customer role required",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { error: true, message: "Name is required" } as ApiResponse,
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(body.name);
    const sanitizedContactNumber = body.contactNumber
      ? sanitizeInput(body.contactNumber)
      : null;

    // Validate name (e.g., length constraints)
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: true, message: "Name must be between 2 and 100 characters" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate contact number if provided (basic regex for phone number)
    if (sanitizedContactNumber) {
      const phoneRegex = /^[0-9+\-\s]{7,15}$/;
      if (!phoneRegex.test(sanitizedContactNumber)) {
        return NextResponse.json(
          { error: true, message: "Invalid phone number format" } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { email: sanitizedEmail },
      {
        $set: {
          name: sanitizedName,
          contactNumber: sanitizedContactNumber,
          updatedAt: new Date(),
        },
      },
      {
        new: true, // Return the updated document
        select: "email name role image contactNumber createdAt updatedAt -_id",
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: true, message: "Failed to update user profile" } as ApiResponse,
        { status: 500 }
      );
    }

    // Prepare response data
    const responseData: ApiResponse<UserProfileResponseData> = {
      error: false,
      message: "User profile updated successfully",
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        image: updatedUser.image || null,
        contactNumber: updatedUser.contactNumber || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error updating user profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (
      error instanceof Error &&
      (error as MongoError).code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        { error: true, message: "Database connection failed" } as ApiResponse,
        { status: 503 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: true, message: "Invalid request body" } as ApiResponse,
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}