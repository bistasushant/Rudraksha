import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddContentRequest } from "@/lib/validation";
import { Content } from "@/models/Content";
import { ApiResponse, IContent } from "@/types";
import { NextRequest, NextResponse } from "next/server";

interface ContentResponse {
  id: string;
  type: "banner" | "package";
  title: string;
  description: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// POST: Add or update a banner or package (one document per type)
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
        message: "Forbidden: You do not have permission to manage content",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log("Received content request body:", body);
    console.log("User role:", user.role);

    if (!validateAddContentRequest(body, user.role)) {
      console.log("Content validation failed");
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const contentData = {
      type: body.type,
      title: sanitizeInput(body.title),
      description: sanitizeInput(body.description),
      image: body.image ? sanitizeInput(body.image) : "",
    };

    // Check if a document of this type exists
    const existingContent = await Content.findOne({ type: body.type });
    const isUpdate = !!existingContent;

    const savedContent = await Content.findOneAndUpdate(
      { type: body.type },
      contentData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const responseData: ApiResponse<ContentResponse> = {
      error: false,
      message: isUpdate
        ? `${body.type === "banner" ? "Banner" : "Package"} updated successfully`
        : `${body.type === "banner" ? "Banner" : "Package"} created successfully`,
      data: {
        id: savedContent._id.toString(),
        type: savedContent.type,
        title: savedContent.title,
        description: savedContent.description,
        image: savedContent.image,
        createdAt: savedContent.createdAt,
        updatedAt: savedContent.updatedAt,
      },
    };
    return NextResponse.json(responseData, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    console.error("Manage Content Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET: Retrieve banners and/or packages
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "banner" | "package" | undefined;

    const query = type ? { type } : {};
    const contentItems = await Content.find(query).lean<IContent[]>();

    const items = contentItems.map((item) => ({
      id: item._id?.toString() || "",
      type: item.type,
      title: item.title,
      description: item.description,
      image: item.image,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const responseData: ApiResponse<ContentResponse[]> = {
      error: false,
      message: "Content retrieved successfully",
      data: items,
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Content Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}