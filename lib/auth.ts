import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse, UserRole } from "@/types";

// Password hashing and comparison functions
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// Unified token generation for all role types
export function generateToken(email: string, role: string): string {
  let secret: string;

  // Use the appropriate secret based on role
  if (role === "customer") {
    secret = process.env.CUSTOMER_JWT_SECRET!;
  } else if (["admin", "editor", "user"].includes(role)) {
    // Use the JWT_SECRET for admin, editor, and user roles
    secret = process.env.JWT_SECRET!;
  } else {
    // Default fallback for any other roles
    secret = process.env.JWT_SECRET!;
  }

  const payload = { email, role };
  return jwt.sign(payload, secret, {
    expiresIn: role === "customer" ? "30d" : "7d",
  });
}

// Extract token from request headers
export const getToken = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

// Authentication middleware function
export async function hasAuth(req: NextRequest) {
  await connectDB(); 

  const token = getToken(req); 
  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: true,
          message: "Unauthorized: No token provided",
        } as ApiResponse,
        { status: 401 }
      ),
    };
  }

  try {
    // Try to decode the token without verification first to determine which secret to use
    const decodedPayload = jwt.decode(token) as {
      email?: string;
      role?: string;
    } | null;

    if (!decodedPayload) {
      throw new Error("Invalid token format");
    }

    // Select the correct secret based on the role in the token
    const secret = (() => {
      if (decodedPayload.role === "customer") {
        return process.env.CUSTOMER_JWT_SECRET;
      } else if (
        ["admin", "editor", "user"].includes(decodedPayload.role || "")
      ) {
        return process.env.JWT_SECRET;
      } else {
        // Default fallback
        return process.env.JWT_SECRET;
      }
    })();

    if (!secret) {
      throw new Error("JWT secret not configured");
    }

    // Now verify with the appropriate secret
    const decoded = jwt.verify(token, secret) as {
      email: string;
      role: UserRole;
    };

    const user = await User.findOne({ email: decoded.email }).select(
      "-password"
    );
    if (!user) {
      return {
        user: null,
        response: NextResponse.json(
          {
            error: true,
            message: "Unauthorized: User not found",
          } as ApiResponse,
          { status: 401 }
        ),
      };
    }

    return {
      user,
      response: null,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      user: null,
      response: NextResponse.json(
        { error: true, message: "Unauthorized: Invalid token" } as ApiResponse,
        { status: 401 }
      ),
    };
  }
}
