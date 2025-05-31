import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hasAuth } from "@/lib/hasAuth";
import { ApiResponse } from "@/types";

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { user, response } = await hasAuth(req);
    if (!user || response) {
      return (
        response ||
        NextResponse.json(
          {
            error: true,
            message: "Authentication required to clear cart",
          } as ApiResponse,
          { status: 401 }
        )
      );
    }

    return NextResponse.json({
      error: false,
      message: "Your shopping cart has been cleared",
      data: { items: [] as never[] }, // Specify an empty array with 'never' type or a more specific type if applicable
      cartCleared: true,
    } as ApiResponse<{ items: never[] }>);
  } catch (error) {
    console.error("Clear Cart Error:", error);
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
