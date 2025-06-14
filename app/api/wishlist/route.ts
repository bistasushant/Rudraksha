import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import WishlistItem from "@/models/WishlistItem";
import { hasAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    await connectDB();

    const { user, response } = await hasAuth(req);
    if (!user || response) {
        return (
            response ||
            NextResponse.json({ error: true, message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const body = await req.json();
        const { productId, productName, productImage, productPrice, productStock } = body;

        if (!productId) {
            return NextResponse.json(
                { error: true, message: "Invalid product ID" } as ApiResponse,
                { status: 400 }
            );
        }

        // Toggle behavior: Check if already in wishlist
        const existing = await WishlistItem.findOne({
            userId: user._id.toString(),
            productId: productId,
        });

        if (existing) {
            // Remove from wishlist
            await WishlistItem.deleteOne({ _id: existing._id });
            return NextResponse.json({
                error: false,
                message: "Removed from wishlist",
            } as ApiResponse);
        } else {
            // Add to wishlist
            const newItem = new WishlistItem({
                userId: user._id.toString(),
                productId,
                productName,
                productImage,
                productPrice,
                productStock,
            });
            await newItem.save();

            return NextResponse.json({
                error: false,
                message: "Added to wishlist",
            } as ApiResponse);
        }
    } catch (error) {
        console.error("Wishlist Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Something went wrong",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    await connectDB();

    const { user, response } = await hasAuth(req);
    if (!user || response) {
        return (
            response ||
            NextResponse.json({ error: true, message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const wishlistItems = await WishlistItem.find({ userId: user._id.toString() }).lean();

        return NextResponse.json({
            error: false,
            message: "Wishlist retrieved successfully",
            data: wishlistItems,
        } as ApiResponse);
    } catch (error) {
        console.error("Get Wishlist Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Failed to fetch wishlist",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
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
            NextResponse.json({ error: true, message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const url = new URL(req.url);
        const productId = url.searchParams.get("productId");

        if (!productId) {
            return NextResponse.json(
                { error: true, message: "Invalid product ID" } as ApiResponse,
                { status: 400 }
            );
        }

        const result = await WishlistItem.deleteOne({
            userId: user._id.toString(),
            productId: productId,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: true, message: "Item not found in wishlist" } as ApiResponse,
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: false, message: "Item removed from wishlist" } as ApiResponse
        );
    } catch (error) {
        console.error("Delete Wishlist Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Failed to remove item",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
            { status: 500 }
        );
    }
}