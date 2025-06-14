import { connectDB } from "@/lib/mongodb";
import { Content } from "@/models/Content";
import { ApiResponse, IContent } from "@/types";
import { NextResponse } from "next/server";

export async function GET() {
    await connectDB();

    try {
        const banner = await Content.findOne({ type: "banner" })
            .select("title description image type createdAt updatedAt")
            .lean<IContent | null>();

        if (!banner) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Banner content not found",
                } as ApiResponse,
                { status: 404 }
            );
        }

        const responseData: ApiResponse<IContent> = {
            error: false,
            message: "Banner content retrieved successfully",
            data: banner,
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
            },
        });
    } catch (error) {
        console.error("Get Banner Error:", error);

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