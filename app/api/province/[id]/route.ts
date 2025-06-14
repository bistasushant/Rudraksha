import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateProvinceRequest } from "@/lib/validation";
import { province } from "@/models/Province";
import { ApiResponse, IProvinceDocument, IProvinceResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

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
        message: "Forbidden: You do not have permission to update provinces",
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
          message: "State or Province ID not found in URL",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!validateUpdateProvinceRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, countryId, isActive } = body;

    const updatedProvince = await province.findByIdAndUpdate(
      id,
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(countryId && { countryId }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      { new: true }
    );

    if (!updatedProvince) {
      return NextResponse.json(
        { error: true, message: "Province not found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Province updated successfully",
        data: updatedProvince,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Province Error:", error);
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
        message: "Forbidden: You do not have permission to delete provinces",
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
          message: "State or Province ID not found in URL",
        },
        { status: 400 }
      );
    }

    const deletedProvince = await province.findByIdAndDelete(id);
    if (!deletedProvince) {
      return NextResponse.json(
        {
          error: true,
          message: "Province not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Province deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Province Error:", error);
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
          message: "State or Province ID not found in URL",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const provinceDoc = await province.findById(id).lean<IProvinceDocument>();

    if (!provinceDoc) {
      return NextResponse.json(
        { error: true, message: "Province not found" } as ApiResponse,
        { status: 404 }
      );
    }

    const responseData: ApiResponse<IProvinceResponse> = {
      error: false,
      message: "Province retrieved successfully",
      data: {
        id: provinceDoc._id.toString(),
        name: provinceDoc.name,
        countryId: provinceDoc.countryId.toString(),
        isActive: provinceDoc.isActive,
        createdAt: provinceDoc.createdAt,
        updatedAt: provinceDoc.updatedAt,
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
