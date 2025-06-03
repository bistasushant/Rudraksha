import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ISettings } from "@/types";
import { NextResponse } from "next/server";
import Settings from "@/models/Settings";

export async function GET() {
    await connectDB();

    try {
        const settings = await Settings.findOne().select("googleAnalytics").lean<ISettings | null>();

        if (!settings || !settings.googleAnalytics) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Google Analytics settings not found",
                } as ApiResponse,
                { status: 404 }
            );
        }

        const responseData: ApiResponse<{ googleAnalytics: ISettings["googleAnalytics"] }> = {
            error: false,
            message: "Google Analytics settings retrieved successfully",
            data: { googleAnalytics: settings.googleAnalytics },
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
            },
        });
    } catch (error) {
        console.error("Get Google Analytics Error:", error);

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
