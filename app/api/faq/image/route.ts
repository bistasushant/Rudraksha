import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateImageRequest } from "@/lib/validation";
import { Faq } from "@/models/Faq";
import { ApiResponse } from "@/types";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface IImage {
  id: string;
  type: "image";
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (!validateImageRequest(body)) {
      return NextResponse.json(
        { error: true, message: "Invalid image URL or base64 string" } as ApiResponse,
        { status: 400 }
      );
    }
    const { image } = body;

    const imageData = {
      type: "image",
      image: sanitizeInput(image),
    };

    // Check if an image document exists before the update
    const existingImage = await Faq.findOne({ type: "image" });
    const isUpdate = !!existingImage;

    const imageDoc = await Faq.findOneAndUpdate(
      { type: "image" },
      imageData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const responseData: ApiResponse<IImage> = {
      error: false,
      message: isUpdate ? "Image updated successfully" : "Image created successfully",
      data: {
        id: imageDoc._id?.toString() || "",
        type: "image",
        image: imageDoc.image || "",
        createdAt: imageDoc.createdAt,
        updatedAt: imageDoc.updatedAt,
      },
    };
    return NextResponse.json(responseData, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    console.error("Manage Image Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectDB();
  try {
    const image = await Faq.findOne({ type: "image" }).lean<{ _id: Types.ObjectId; image: string; createdAt?: Date; updatedAt?: Date; }>();
    if (!image) {
      return NextResponse.json(
        { error: true, message: "No image found" } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<IImage> = {
      error: false,
      message: "Image retrieved successfully",
      data: {
        id: image._id?.toString() || "",
        type: "image",
        image: image.image || "",
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      },
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Image Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}