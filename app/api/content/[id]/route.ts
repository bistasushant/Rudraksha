import { connectDB } from "@/lib/mongodb";
import { Content } from "@/models/Content";
import { ApiResponse, IContent } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// /api/content/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      {
        error: true,
        message: "Content ID is required and must be a string",
      } as ApiResponse,
      { status: 400 }
    );
  }

  // Optional: Check if id is a valid Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      {
        error: true,
        message: "Invalid content ID format",
      } as ApiResponse,
      { status: 400 }
    );
  }

  try {
    const content = await Content.findById(id)
      .select("title description image type createdAt updatedAt")
      .lean<IContent | null>();

    if (!content) {
      return NextResponse.json(
        {
          error: true,
          message: "Content not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<IContent> = {
      error: false,
      message: "Content retrieved successfully",
      data: content,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Get Content Error:", error);

    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
