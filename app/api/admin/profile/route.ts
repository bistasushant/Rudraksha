import { NextRequest, NextResponse } from "next/server";
import { hasAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        // Connect to database
        await connectDB();

        // Authenticate user
        const { user, response } = await hasAuth(req);
        if (!user || response) {
            return (
                response ||
                NextResponse.json(
                    { error: true, message: "Unauthorized" } as ApiResponse,
                    { status: 401 }
                )
            );
        }

        // Ensure user is an admin
        if (user.role !== "admin") {
            return NextResponse.json(
                {
                    error: true,
                    message: "Forbidden: Only admins can access admin profile",
                } as ApiResponse,
                { status: 403 }
            );
        }

        // Get admin profile data
        const adminData = await User.findById(user._id).select("-password");
        if (!adminData) {
            return NextResponse.json(
                {
                    error: true,
                    message: "Admin profile not found",
                } as ApiResponse,
                { status: 404 }
            );
        }

        // Build response
        const responseData: ApiResponse<{
            name: string;
            email: string;
            role: string;
            image?: string;
            contactNumber?: string;
        }> = {
            error: false,
            message: "Admin profile retrieved successfully",
            data: {
                name: adminData.name,
                email: adminData.email,
                role: adminData.role,
                image: adminData.image,
                contactNumber: adminData.contactNumber,
            },
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error("Get Admin Profile Error:", error);
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