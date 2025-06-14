import { NextRequest, NextResponse } from "next/server";
import Contact from "@/models/Contact";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth";

// Allow multiple origins for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or specify: "http://localhost:3000,http://192.168.1.80:3000"
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS: Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: Fetch contact info (public)
export async function GET() {
  try {
    await connectDB();
    const existing = await Contact.findOne();

    return NextResponse.json(
      {
        error: false,
        data: existing ?? {
          email: "",
          phone: "",
          address: "",
          mapEmbedUrl: "",
        },
      } as ApiResponse,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching contact info:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create or update contact info (admin-only)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { user, response } = await hasAuth(req);

    // Check if the user is authenticated
    if (!user || response) {
      return (
        response ||
        NextResponse.json(
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401, headers: corsHeaders }
        )
      );
    }

    // Check if the user has admin role
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only administrators can manage contact info",
        } as ApiResponse,
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { email, phone, address, mapEmbedUrl } = body;

    // Validate required fields
    if (!email || !phone || !address) {
      return NextResponse.json(
        { error: true, message: "Missing required fields" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }
    const phoneRegex = /^\+?\d{1,4}[\s-]?\d{7,}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: true, message: "Invalid phone number" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if contact info already exists
    const existingContact = await Contact.findOne();

    let updatedContact;
    if (existingContact) {
      // Update existing contact info
      existingContact.email = email;
      existingContact.phone = phone;
      existingContact.address = address;
      existingContact.mapEmbedUrl = mapEmbedUrl || "";
      updatedContact = await existingContact.save();
    } else {
      // Create new contact info
      updatedContact = await Contact.create({
        email,
        phone,
        address,
        mapEmbedUrl: mapEmbedUrl || "",
      });
    }

    return NextResponse.json(
      {
        error: false,
        message: "Contact info saved successfully",
        data: {
          email: updatedContact.email,
          phone: updatedContact.phone,
          address: updatedContact.address,
          mapEmbedUrl: updatedContact.mapEmbedUrl,
        },
      } as ApiResponse,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error saving contact info:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
