import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateSizeRequest } from "@/lib/validation";
import { productSize } from "@/models/ProductSize";
import { ApiResponse } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);

  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401 }
      )
    );
  }

  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message:
          "Forbidden: You do not have permission to update product sizes",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: true, message: "Invalid product size ID" } as ApiResponse,
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!validateUpdateSizeRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const { size, isActive } = body;

    interface UpdateSizeData {
      size?: string;
      isActive?: boolean;
    }

    const updateData: UpdateSizeData = {};

    if (size !== undefined) {
      updateData.size = sanitizeInput(size);
    }

    if (isActive !== undefined) {
      // Handle both boolean and string boolean values
      updateData.isActive =
        typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
    }

    const updatedSize = await productSize.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedSize) {
      return NextResponse.json(
        { error: true, message: "Product Size not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Product Size updated successfully",
        data: updatedSize,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Product Size Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
  if (user.role !== "admin") {
    return NextResponse.json({
      error: true,
      message:
        "Forbidden: You do not have permission to delete product size",
    },
    { status: 403 }
  );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if(!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: true, message: "Invalid product size ID"
        },
        { status: 400 }
      );
    }
    const deleteProductSize = await productSize.findByIdAndDelete(id);

    if(!deleteProductSize) {
      return NextResponse.json(
        { error: true, message: "Product Size not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false, message: "Product Size deleted successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Product Size Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: true,
          message: "Product size ID is required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product size ID format",
        },
        { status: 400 }
      );
    }

    const foundSize = await productSize.findById(id).lean();

    if (!foundSize) {
      return NextResponse.json(
        {
          error: true,
          message: "Product size not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: foundSize,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Product Size Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}