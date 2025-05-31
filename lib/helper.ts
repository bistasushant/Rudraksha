import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

/**
 * Decodes a JWT token and returns the payload
 * @param token - The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export const getDecoded = (
  token: string
): { email: string; role: string } | null => {
  try {
    // Try to decode without verification first to determine which secret to use
    const decodedPayload = jwt.decode(token) as {
      email?: string;
      role?: string;
    } | null;

    if (!decodedPayload) {
      console.error("Invalid token format");
      return null;
    }

    // Select the correct secret based on the role in the token
    const secret =
      decodedPayload.role === "customer"
        ? process.env.CUSTOMER_JWT_SECRET
        : process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT secret not configured");
      return null;
    }

    // Now verify with the appropriate secret
    const decoded = jwt.verify(token, secret) as {
      email: string;
      role: string;
    };

    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Extracts the token from request headers
 * @param req - The Next.js request object
 * @returns The token string or null if not found
 */
export const getTokenFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

/**
 * Generates a JWT token for a user based on role
 * @param email - The user's email to encode in the token
 * @param role - The user's role (customer, admin, editor, user)
 * @returns The generated JWT token
 */
export const generateToken = (email: string, role: string): string => {
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
};
