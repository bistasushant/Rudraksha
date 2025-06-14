import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { productDesign } from "@/models/ProductDesign";
import { ApiResponse, IDesign } from "@/types";
import mongoose from "mongoose";
import { validateUpdateDesignRequest } from "@/lib/validation";

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
        message: "Forbidden: You do not have permission to update product designs",
      } as ApiResponse,
      { status: 403 }
      );
  }

  try {
    const body = await req.json();
    const designId = req.nextUrl.pathname.split("/").pop();

    // Log the received body for debugging
    console.log("Received update request body:", body);

    if (!designId || !mongoose.Types.ObjectId.isValid(designId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product design ID" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate the request body
    if (!validateUpdateDesignRequest(body, user.role)) {
      console.log("Validation failed for body:", body);
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product design update data provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Extract all fields that might be updated
    const { title, image, price, productId } = body;

    // Build update object dynamically, only including defined values
    const updateData: Partial<IDesign> = {
      updatedAt: new Date(),
    };

    if (title !== undefined && title !== null && title.trim() !== '') {
      updateData.title = title.trim();
    }

    if (image !== undefined && image !== null && image !== '') {
      updateData.image = image;
    }

    if (price !== undefined && price !== null && !isNaN(price)) {
      updateData.price = typeof price === 'string' ? parseFloat(price) : price;
    }

    if (productId !== undefined && productId !== null && productId.trim() !== '') {
      // Validate productId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(productId)) {
        updateData.productId = new mongoose.Types.ObjectId(productId.trim());
      }
    }

    console.log("Update data to be applied:", updateData);

    // Use the properly built updateData object instead of rebuilding it
    const updatedDesign = await productDesign.findByIdAndUpdate(
      designId,
      updateData, // Use the updateData object we built above
      { new: true }
    ).lean();

    if (!updatedDesign) {
      return NextResponse.json(
        {
          error: true,
          message: "Product design not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Product design updated successfully",
        data: updatedDesign,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /designs error:", error);
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
export async function GET(req: NextRequest) {
  await connectDB();

  const designId = req.nextUrl.pathname.split("/").pop();

  if (!designId || !mongoose.Types.ObjectId.isValid(designId)) {
    return NextResponse.json(
      { error: true, message: "Invalid product design ID" } as ApiResponse,
      { status: 400 }
    );
  }

  try {
    const design = await productDesign.findById(designId).lean();

    if (!design) {
      return NextResponse.json(
        { error: true, message: "Product design not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Success", data: design } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /designs error:", error);
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
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401 }
      )
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only admins can delete product designs",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const designId = req.nextUrl.pathname.split("/").pop();

    if (!designId || !mongoose.Types.ObjectId.isValid(designId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product design ID" } as ApiResponse,
        { status: 400 }
      );
    }

    const deleted = await productDesign.findByIdAndDelete(designId);

    if (!deleted) {
      return NextResponse.json(
        { error: true, message: "Product design not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Product design deleted successfully" } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /designs error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
