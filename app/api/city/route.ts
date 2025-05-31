import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateAddCityRequest,
} from "@/lib/validation";
import { city } from "@/models/City";
import {
  ApiResponse,
  ICityDocument,
  ICityResponse,
} from "@/types";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const cityId = searchParams.get("cityId") || undefined;
    const skip = (page - 1) * limit;

    const filter: Partial<Record<"cityId", string>> = {};
    if (cityId) {
      if (!Types.ObjectId.isValid(cityId)) {
        return NextResponse.json(
          { error: true, message: "Invalid cityId format" } as ApiResponse,
          { status: 400 }
        );
      }
      filter.cityId = cityId;
    }

    const total = await city.countDocuments(filter);
    const cities = await city
      .find(filter)
      .skip(skip)
      .limit(limit)
      .lean<ICityDocument[]>();

    const sanitizedCities: ICityResponse[] = cities.map((city) => ({
      id: city._id.toString(),
      name: city.name,
      provinceId: city.provinceId.toString(),
      shippingCost: city.shippingCost,
      isActive: city.isActive,
      createdAt: city.createdAt,
      updatedAt: city.updatedAt,
    }));

    const responseData: ApiResponse<{
      cities: ICityResponse[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Cities retrieved successfully",
      data: {
        cities: sanitizedCities,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Cities Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        {
          error: true,
          message: "Unauthorized",
        } as ApiResponse,
        { status: 401 }
      )
    );
  }

  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only admins and editors can add cities",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (!validateAddCityRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, provinceId, shippingCost, isActive } = body;
    const sanitizedName = sanitizeInput(name);

    const existingCity = await city.findOne({
      name: sanitizedName,
      provinceId: new Types.ObjectId(provinceId),
    });

    if (existingCity) {
      return NextResponse.json(
        {
          error: true,
          message:
            "City with this name already exists in the state or province",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const cityData = {
      name: sanitizedName,
      provinceId: new Types.ObjectId(provinceId),
      shippingCost: shippingCost,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };

    const newCity = new city(cityData);
    const savedCity = await newCity.save();

    const responseData: ApiResponse<ICityResponse> = {
      error: false,
      message: "City added successfully",
      data: savedCity,
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Province Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
