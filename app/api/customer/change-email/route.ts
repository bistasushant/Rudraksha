import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput, validateEmail } from "@/lib/validation";
import { ApiResponse } from "@/types";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hasAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const { user, response } = await hasAuth(req);
    if (response) return response;

    const body = await req.json();
    const { newEmail } = body;

    // Validate request
    if (!newEmail || typeof newEmail !== "string" || !validateEmail(newEmail)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" } as ApiResponse,
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeInput(newEmail.toLowerCase());

    // Check if email is already in use
    const existingCustomer = await User.findOne({ email: sanitizedEmail });
    if (existingCustomer) {
      return NextResponse.json(
        { error: true, message: "Customer is already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    // Update user's email
    const updatedCustomer = await User.findOneAndUpdate(
      { email: user.email },
      { email: sanitizedEmail },
      { new: true, select: "email name role image contactNumber" }
    );

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: true, message: "Customer not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Return updated user data
    return NextResponse.json({
      error: false,
      message: "Email updated successfully",
      data: {
        email: updatedCustomer.email,
        name: updatedCustomer.name,
        role: updatedCustomer.role,
        image: updatedCustomer.image || "",
        contactNumber: updatedCustomer.contactNumber || null,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Change email error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
