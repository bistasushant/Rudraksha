// api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { hasAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
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
        message: "Forbidden: You do not have permission to upload images",
      },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: true, message: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name}`;
    
    // Save to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);
    
    await writeFile(filepath, buffer);
    
    // Return the public URL for the uploaded image
    const imageUrl = `/uploads/${filename}`;
    
    return NextResponse.json({
      error: false,
      message: "Image uploaded successfully",
      data: { imageUrl }
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: true, message: "Failed to upload image" },
      { status: 500 }
    );
  }
}
