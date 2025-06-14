import { connectDB } from "@/lib/mongodb";
import { ApiResponse, ISettings } from "@/types";
import { NextResponse } from "next/server";
import Settings from "@/models/Settings";

export async function GET() {
    await connectDB();

    try {
        const settings = await Settings.findOne().select("logo").lean<ISettings | null>();

        if (!settings || !settings.logo) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Logo not found",
                } as ApiResponse,
                { status: 404 }
            );
        }

        const responseData: ApiResponse<{ logo: ISettings["logo"] }> = {
            error: false,
            message: "Logo retrieved successfully",
            data: { logo: settings.logo },
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
            },
        });
    } catch (error) {
        console.error("Get Logo Error:", error);

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
