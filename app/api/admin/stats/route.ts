import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { Checkout } from "@/models/Checkout";
import User from "@/models/User";
import { hasAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        // Connect to database
        await connectDB();

        // Authenticate user
        const { user, response } = await hasAuth(req);
        if (response) return response;

        // Ensure user is an admin
        if (user.role !== "admin") {
            return NextResponse.json(
                {
                    error: true,
                    message: "Forbidden: Only admins can access admin stats",
                } as ApiResponse,
                { status: 403 }
            );
        }

        // Get total orders
        const totalOrders = await Checkout.countDocuments();

        // Get orders by status
        const ordersByStatus = await Checkout.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get total revenue
        const revenueResult = await Checkout.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: { $ifNull: ["$totalAmount", 0] } } },
                },
            },
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Get total customers
        const totalCustomers = await User.countDocuments({ role: "customer" });

        // Get recent orders (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentOrders = await Checkout.countDocuments({
            createdAt: { $gte: oneWeekAgo },
        });

        // Get recent revenue (last 7 days)
        const recentRevenueResult = await Checkout.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneWeekAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: { $ifNull: ["$totalAmount", 0] } } },
                },
            },
        ]);
        const recentRevenue = recentRevenueResult[0]?.total || 0;

        // Format orders by status
        const statusCounts = {
            pending: 0,
            confirm: 0,
            processing: 0,
            pickup: 0,
            "on the way": 0,
            delivered: 0,
            cancelled: 0,
        };

        ordersByStatus.forEach((status) => {
            statusCounts[status._id as keyof typeof statusCounts] = status.count;
        });

        // Build response
        const responseData: ApiResponse<{
            totalOrders: number;
            ordersByStatus: typeof statusCounts;
            totalRevenue: number;
            totalCustomers: number;
            recentOrders: number;
            recentRevenue: number;
        }> = {
            error: false,
            message: "Admin stats retrieved successfully",
            data: {
                totalOrders,
                ordersByStatus: statusCounts,
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalCustomers,
                recentOrders,
                recentRevenue: Number(recentRevenue.toFixed(2)),
            },
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error("Get Admin Stats Error:", error);
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