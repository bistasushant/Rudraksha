import { NextRequest, NextResponse } from "next/server";
import About from "@/models/About";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, IAbout } from "@/types";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { hasAuth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all for development
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: Fetch About Us info (public)
export async function GET() {
  try {
    await connectDB();
    const aboutInfo = (await About.findOne().lean()) as IAbout | null;

    return NextResponse.json(
      {
        error: false,
        message: aboutInfo
          ? "About Us info retrieved successfully"
          : "No About Us info found",
        data: aboutInfo || { title: "", description: "", imageUrl: "" },
      } as ApiResponse,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Get About Us Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create or update About Us info (admin-only)
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return (
        response ||
        NextResponse.json(
          { error: true, message: "Unauthorized" } as ApiResponse,
          { status: 401, headers: corsHeaders }
        )
      );
    }
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only administrators can manage About Us info",
        } as ApiResponse,
        { status: 403, headers: corsHeaders }
      );
    }

    await connectDB();
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as File | null;

    // Validate required fields
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        {
          error: true,
          message: "Missing required fields: title, description",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate image if provided
    let imageUrl = "";
    if (image) {
      const validTypes = ["image/png", "image/jpeg"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(image.type)) {
        return NextResponse.json(
          {
            error: true,
            message: "Invalid image type. Use PNG or JPEG",
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      if (image.size > maxSize) {
        return NextResponse.json(
          { error: true, message: "Image size exceeds 5MB" } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }

      // Save image to /public/uploads
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const fileName = `${Date.now()}-${image.name.replace(/\s+/g, "-")}`;
      const filePath = join(uploadDir, fileName);
      const bytes = await image.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      imageUrl = `/uploads/${fileName}`;
    }

    // Check if About Us info exists
    const existingAbout = await About.findOne();
    let updatedAbout;

    if (existingAbout) {
      // Update existing
      existingAbout.title = title.trim();
      existingAbout.description = description.trim();
      if (imageUrl) {
        existingAbout.imageUrl = imageUrl;
      }
      updatedAbout = await existingAbout.save();
    } else {
      // Create new
      updatedAbout = await About.create({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || "",
      });
    }

    return NextResponse.json(
      {
        error: false,
        message: existingAbout
          ? "About Us info updated successfully"
          : "About Us info created successfully",
        data: {
          title: updatedAbout.title,
          description: updatedAbout.description,
          imageUrl: updatedAbout.imageUrl,
        },
      } as ApiResponse,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error saving About Us info:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
