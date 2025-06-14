import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import path from "path";
import fs from "fs/promises";
import { hasAuth } from "@/lib/auth";

const uploadDir = path.join(process.cwd(), "public/uploads/profile-images");
const maxFileSize = 5 * 1024 * 1024; // 5MB

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await ensureUploadDir();

    // Check authentication
    const { user, response } = await hasAuth(req);
    if (response) {
      return response;
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: true, message: "No image file provided" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: true,
          message: "File size exceeds 5MB limit",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user._id}-${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    // Remove old image if exists
    const existingUser = await User.findById(user._id);
    if (existingUser?.image && existingUser.image !== "") {
      const oldImagePath = path.join(
        process.cwd(),
        "public",
        existingUser.image
      );
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.warn("Could not delete old image:", error);
      }
    }

    // Update user with new image path
    const imageUrl = `/public/uploads/profile-images/${filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { image: imageUrl },
      { new: true, select: "email name role image contactNumber" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      message: "Profile image updated successfully",
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        image: updatedUser.image || "",
        contactNumber: updatedUser.contactNumber || "",
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
