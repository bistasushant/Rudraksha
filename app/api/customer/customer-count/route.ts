import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { hasAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
    try {
        // Authenticate
        const { user, response } = await hasAuth(req);
        if (response) return response;

        // Allow only admin and editor roles
        const allowedRoles = ["admin", "editor", "user"];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json(
                { error: true, message: "Forbidden: Insufficient permissions" } as ApiResponse,
                { status: 403 }
            );
        }

        // Calculate date 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Count new customers
        const newCustomersCount = await User.countDocuments({
            role: "customer",
            createdAt: { $gte: oneWeekAgo },
        });

        // Count total customers
        const totalCustomersCount = await User.countDocuments({
            role: "customer"
        });

        return NextResponse.json(
            {
                error: false,
                message: "Customer counts retrieved successfully",
                data: { 
                    newCustomersCount,
                    totalCustomersCount 
                },
            } as ApiResponse<{ 
                newCustomersCount: number;
                totalCustomersCount: number;
            }>,
            { status: 200 }
        );
    } catch (error) {
        console.error("Error retrieving customer counts:", error);

        return NextResponse.json(
            { error: true, message: "Internal server error" } as ApiResponse,
            { status: 500 }
        );
    }
}
