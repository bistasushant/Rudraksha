import { NextResponse } from "next/server";
import { Product } from "@/models/Products";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
    try {
        await connectDB();

        // Find all products where feature is true
        const products = await Product.find({ feature: true })
            .select('name slug price images feature')
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(4); // Limit to 4 products

        if (!products || products.length === 0) {
            return NextResponse.json(
                { 
                    error: false, 
                    message: "No feature products found",
                    data: { products: [] }
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                error: false,
                message: "Feature products fetched successfully",
                data: { products }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching feature products:', error);
        return NextResponse.json(
            {
                error: true,
                message: "Failed to fetch feature products",
                data: null
            },
            { status: 500 }
        );
    }
}
