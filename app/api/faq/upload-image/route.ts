import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Faq } from "@/models/Faq";
import { ApiResponse } from "@/types";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to manage the image",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: true, message: "No file uploaded" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: true, message: "Only image files are allowed" } as ApiResponse,
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `faq-${uniqueSuffix}${path.extname(file.name)}`;
    
    // Save to public directory
    const publicDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(publicDir, filename);
    await writeFile(filepath, buffer);

    // Save image path to database
    const imagePath = `/uploads/${filename}`;
    await Faq.findOneAndUpdate(
      { type: "image" },
      { type: "image", image: imagePath },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const responseData: ApiResponse<{ image: string }> = {
      error: false,
      message: "Image uploaded successfully",
      data: {
        image: imagePath,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Upload Image Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
} 