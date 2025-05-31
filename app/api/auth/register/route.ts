import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateRole,
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/validation";
import User from "@/models/User";
import { ApiResponse, RegisterResponseData, UserRole } from "@/types";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

async function getCurrentUserRole(req: Request): Promise<UserRole | null> {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, secret) as {
      email: string;
      role: UserRole;
    };
    return decoded.role;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if this is the first admin (bypass RBAC for initial admin setup)
    const adminExists = await User.findOne({ role: "admin" });
    const isInitialSetup = !adminExists;

    // Get current user's role and enforce admin-only registration (unless initial setup)
    const currentUserRole = await getCurrentUserRole(req);
    if (
      !isInitialSetup &&
      (!currentUserRole || !validateRole(currentUserRole, "admin"))
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Only admins can register new users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Parse and validate request body
    const { email, name, password, confirmPassword, role, contactNumber } =
      body;

    // Validate required fields
    if (!email || !name || !password || !confirmPassword || !role) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Email, name, password, confirmPassword, and role are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate name
    if (!validateName(name)) {
      return NextResponse.json(
        { error: true, message: "Name cannot be empty" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate password and confirmPassword
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          error: true,
          message: "Password and confirmPassword must match",
        } as ApiResponse,
        { status: 400 }
      );
    }
    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ["admin", "editor", "user", "customer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: true, message: "Invalid role" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate contactNumber for customer role
    if (role === "customer" && (!contactNumber || !contactNumber.trim())) {
      return NextResponse.json(
        {
          error: true,
          message: "Contact number is required for customer role",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);
    const sanitizedContactNumber = contactNumber
      ? sanitizeInput(contactNumber)
      : undefined;

    // Check for existing user
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: true, message: "Email already exists" } as ApiResponse,
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await User.create({
      email: sanitizedEmail,
      name: sanitizedName,
      password: hashedPassword,
      role,
      contactNumber: sanitizedContactNumber,
      image: "",
    });

    const responseData: ApiResponse<RegisterResponseData> = {
      error: false,
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } added successfully`,
      data: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        contactNumber: newUser.contactNumber,
      },
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: true, message: error.message } as ApiResponse,
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
