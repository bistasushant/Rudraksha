import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddProvinceRequest } from "@/lib/validation";
import { province } from "@/models/Province";
import { ApiResponse, IProvinceResponse, IProvinceDocument } from "@/types";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const countryId = searchParams.get("countryId") || undefined;
    const skip = (page - 1) * limit;

    const filter: Partial<Record<"countryId", string>> = {};
    if (countryId) {
      if (!Types.ObjectId.isValid(countryId)) {
        return NextResponse.json(
          { error: true, message: "Invalid countryId format" } as ApiResponse,
          { status: 400 }
        );
      }
      filter.countryId = countryId;
    }

    const total = await province.countDocuments(filter);
    const provinces = await province
      .find(filter)
      .skip(skip)
      .limit(limit)
      .lean<IProvinceDocument[]>();

    const sanitizedProvinces: IProvinceResponse[] = provinces.map((prov) => ({
      id: prov._id.toString(),
      name: prov.name,
      countryId: prov.countryId.toString(), // Now correctly converts ObjectId to string
      isActive: prov.isActive,
      createdAt: prov.createdAt,
      updatedAt: prov.updatedAt,
    }));

    const responseData: ApiResponse<{
      provinces: IProvinceResponse[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Provinces retrieved successfully",
      data: {
        provinces: sanitizedProvinces,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Provinces Error:", error);
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
        message: "Forbidden: Only admins and editors can add province",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (!validateAddProvinceRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, countryId, isActive } = body;
    const sanitizedName = sanitizeInput(name);

    const existingProvince = await province.findOne({
      name: sanitizedName,
      countryId: new Types.ObjectId(countryId),
    });

    if (existingProvince) {
      return NextResponse.json(
        {
          error: true,
          message: "Province with this name already exists in the country",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const provinceData = {
      name: sanitizedName,
      countryId: new Types.ObjectId(countryId),
      isActive: typeof isActive === "boolean" ? isActive : true,
    };

    const newProvince = new province(provinceData);
    const savedProvince = await newProvince.save();

    const responseData: ApiResponse<IProvinceResponse> = {
      error: false,
      message: "Province added successfully",
      data: savedProvince,
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
