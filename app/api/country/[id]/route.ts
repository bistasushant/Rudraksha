import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateCountryRequest } from "@/lib/validation";
import { country } from "@/models/Country";
import { ApiResponse, ICountryResponse } from "@/types";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface ICountryDocument {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
        message:
          "Forbidden: You do not have permission to update blog countries",
      },
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          error: true,
          message: "ID not found in URL",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const body = await req.json();

    if (!validateUpdateCountryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }
    const { name, isActive } = body;
    const updatedCountry = await country.findByIdAndUpdate(
      id,
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      { new: true }
    );
    if (!updatedCountry) {
      return NextResponse.json(
        { error: true, message: "Country not found" } as ApiResponse,
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Country updated successfully",
        data: updatedCountry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Country Error:", error);
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
        {
          error: true,
          message: "Unauthorized",
        },
        { status: 401 }
      )
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to delete countries",
      },
      { status: 403 }
    );
  }
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          error: true,
          message: "ID not found in URL",
        },
        { status: 400 }
      );
    }
    const deletedCountry = await country.findByIdAndDelete(id);
    if (!deletedCountry) {
      return NextResponse.json(
        {
          error: true,
          message: "Country not found",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: false,
        message: "Country deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Country Error:", error);
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
          message: "ID not found in URL",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const countryDoc = await country.findById(id).lean<ICountryDocument>();
    
    if (!countryDoc) {
      return NextResponse.json(
        { error: true, message: "Country not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<ICountryResponse> = {
      error: false,
      message: "Country retrieved successfully",
      data: {
        id: countryDoc._id.toString(),
        name: countryDoc.name,
        isActive: countryDoc.isActive,
        createdAt: countryDoc.createdAt,
        updatedAt: countryDoc.updatedAt,
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Countries Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
