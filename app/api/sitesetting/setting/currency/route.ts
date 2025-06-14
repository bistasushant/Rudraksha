import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ISettings } from "@/types";
import { NextResponse } from "next/server";
import Settings from "@/models/Settings";

export async function GET() {
    await connectDB();

    try {
        const settings = await Settings.findOne().select("currency").lean<ISettings | null>();

        if (!settings || !settings.currency) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Currency not found",
                } as ApiResponse,
                { status: 404 }
            );
        }

        const responseData: ApiResponse<{ currency: ISettings["currency"] }> = {
            error: false,
            message: "Currency retrieved successfully",
            data: { currency: settings.currency },
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
            },
        });
    } catch (error) {
        console.error("Get Currency Error:", error);

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
