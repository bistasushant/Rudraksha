import { connectDB } from "@/lib/mongodb";
import { city } from "@/models/City";
import { hasAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput, validateUpdateCityRequest } from "@/lib/validation";
import { ApiResponse, ICityDocument, ICityResponse } from "@/types";

export async function PATCH(req: NextRequest) {
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
        message: "Forbidden: You do not have permission to update cities",
      },
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: true, message: "City ID not found in URL" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!validateUpdateCityRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" },
        { status: 400 }
      );
    }

    const { name, provinceId, shippingCost, isActive } = body;

    // Update the city document
    const updatedCity = await city.findByIdAndUpdate(
      id,
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(provinceId && { provinceId }),
        ...(shippingCost !== undefined && { shippingCost }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!updatedCity) {
      return NextResponse.json(
        { error: true, message: "City not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "City updated successfully",
        data: updatedCity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating city:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
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
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to delete cities",
      },
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: true, message: "City ID not found in URL" },
        { status: 400 }
      );
    }

    const deletedCity = await city.findByIdAndDelete(id);

    if (!deletedCity) {
      return NextResponse.json(
        { error: true, message: "City not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "City deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting city:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          error: true,
          message: "City ID not found in URL",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const cityDoc = await city.findById(id).lean<ICityDocument>();

    if (!cityDoc) {
      return NextResponse.json(
        { error: true, message: "City not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<ICityResponse> = {
      error: false,
      message: "City retrieved successfully",
      data: {
        id: cityDoc._id.toString(),
        name: cityDoc.name,
        provinceId: cityDoc.provinceId.toString(),
        shippingCost: cityDoc.shippingCost,
        isActive: cityDoc.isActive,
        createdAt: cityDoc.createdAt,
        updatedAt: cityDoc.updatedAt,
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Cities Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
