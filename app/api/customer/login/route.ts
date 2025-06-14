import { comparePassword, generateToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateLoginRequest } from "@/lib/validation";
import User from "@/models/User";
import { ApiResponse, CustomerLoginResponseData } from "@/types";
import { NextResponse } from "next/server";

// Define MongoDB error interface
interface MongoError extends Error {
  code?: string | number;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate request body
    if (!validateLoginRequest(body)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format. Email and password are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { email, password } = body;
    const sanitizedEmail = sanitizeInput(email);

    // Find user by email (no role restriction for flexibility)
    const user = await User.findOne({ email: sanitizedEmail }).select(
      "email name password contactNumber image role"
    );

    if (!user) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid email or password",
        } as ApiResponse,
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid email or password",
        } as ApiResponse,
        { status: 401 }
      );
    }

    // Generate token with secure expiration (assuming generateToken handles this)
    const token = generateToken(user.email, user.role);

    const responseData: ApiResponse<CustomerLoginResponseData> = {
      error: false,
      message: "Login successful",
      data: {
        token,
        email: user.email,
        name: user.name,
        contactNumber: user.contactNumber,
        image: user.image || null, // Ensure image is null if undefined
        role: user.role,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Customer login error:", error);

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
