import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddCountryRequest } from "@/lib/validation";
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

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await country.countDocuments();
    const countries = await country
      .find({})
      .skip(skip)
      .limit(limit)
      .lean<ICountryDocument[]>();

    const sanitizedCountries: ICountryResponse[] = countries.map((country) => ({
      id: country._id.toString(),
      name: country.name,
      isActive: country.isActive,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
    }));

    const responseData: ApiResponse<{
      countries: ICountryResponse[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Countries retrieved successfully",
      data: {
        countries: sanitizedCountries,
        total,
        page,
        totalPages: Math.ceil(total / limit),
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
        message: "Forbidden: Only admins and editors can add country",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    if (!validateAddCountryRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, isActive } = body;
    const sanitizedName = sanitizeInput(name);

    const existingCountry = await country.findOne({
      name: sanitizedName,
    });

    if (existingCountry) {
      return NextResponse.json(
        {
          error: true,
          message: "Country with this name is already exist.",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const countryData = {
      name: sanitizedName,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };

    const newCountry = new country(countryData);
    const savedCountry = await newCountry.save();

    const responseData: ApiResponse<ICountryResponse> = {
      error: false,
      message: "Country added successfully",
      data: savedCountry,
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Country Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
