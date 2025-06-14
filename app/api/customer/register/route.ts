import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateRegisterCustomerRequest,
} from "@/lib/validation";
import User from "@/models/User";
import { ApiResponse, CustomerRegisterResponseData } from "@/types";
import { NextResponse } from "next/server";

// Type guard for MongoDB errors
function isMongoError(error: unknown): error is { code: string | number } {
  return typeof error === "object" && error !== null && "code" in error;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!validateRegisterCustomerRequest(body)) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Invalid request format. Email, userName, password, confirmPassword, and valid phone number are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { email, name, password, contactNumber, image } = body;

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(contactNumber);
    const sanitizedImage = image ? sanitizeInput(image) : undefined;

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: true, message: "Email already exists" } as ApiResponse,
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new customer
    const newUser = await User.create({
      email: sanitizedEmail,
      name: sanitizedName,
      password: hashedPassword,
      role: "customer" as const,
      contactNumber: sanitizedPhone,
      image: sanitizedImage,
    });

    const responseData: ApiResponse<CustomerRegisterResponseData> = {
      error: false,
      message: "Customer registered successfully",
      data: {
        email: newUser.email,
        name: newUser.name,
        contactNumber: newUser.contactNumber,
        role: newUser.role,
      },
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Customer registration error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: true, message: error.message } as ApiResponse,
        { status: 400 }
      );
    }
    if (error instanceof Error && isMongoError(error) && error.code === 11000) {
      return NextResponse.json(
        { error: true, message: "Email already exists" } as ApiResponse,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
