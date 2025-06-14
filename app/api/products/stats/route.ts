import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Products";
import { ApiResponse } from "@/types";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();

        const startOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );

        const total = await Product.countDocuments();
        const newProductsCount = await Product.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        const responseData: ApiResponse<{
            total: number;
            newProductsCount: number;
        }> = {
            error: false,
            message: "Product stats fetched successfully",
            data: {
                total,
                newProductsCount,
            },
        };

        return NextResponse.json(responseData, {
            status: 200,
        });
    } catch (error) {
        console.error("Get Product Stats Error:", error);
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
