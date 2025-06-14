import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { ApiResponse } from "@/types";
import { saveFileLocally } from "@/lib/fileSave";
import { hasAuth } from "@/lib/auth";

interface HeroData {
    title: string;
    subtitle: string;
    videoUrl: string;
    images: string[];
}

interface SettingsDocument {
    hero?: HeroData;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
    try {
        await connectDB();

        // Only fetch the hero field from settings
        const settings = await Settings.findOne({}, { hero: 1 }).lean() as SettingsDocument | null;

        // Ensure hero data is properly structured in the response
        const heroData: HeroData = settings?.hero || {
            title: "",
            subtitle: "",
            videoUrl: "",
            images: [],
        };

        return NextResponse.json(
            {
                error: false,
                message: settings ? "Hero data retrieved successfully" : "No hero data found",
                data: { hero: heroData },
            } as ApiResponse,
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error("GET Hero Data Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const { user, response } = await hasAuth(req);

        if (!user || response) {
            return response || NextResponse.json(
                { error: true, message: "Unauthorized" } as ApiResponse,
                { status: 401, headers: corsHeaders }
            );
        }

        if (user.role !== "admin") {
            return NextResponse.json(
                { error: true, message: "Forbidden: Only administrators can manage settings" } as ApiResponse,
                { status: 403, headers: corsHeaders }
            );
        }

        const formData = await req.formData();
        const updateData: Partial<HeroData> = {};

        // Fetch existing settings
        const existingSettings = await Settings.findOne({}, { hero: 1 }).lean() as SettingsDocument | null;
        const existingHero = existingSettings?.hero || { title: "", subtitle: "", videoUrl: "", images: [] };

        // Handle video upload
        const videoFile = formData.get("video") as File | null;
        if (videoFile) {
            const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
            if (!validVideoTypes.includes(videoFile.type)) {
                return NextResponse.json(
                    { error: true, message: "Invalid video file type" } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
            if (videoFile.size > 25 * 1024 * 1024) {
                return NextResponse.json(
                    { error: true, message: "Video file size exceeds 25MB" } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
            const timestamp = Date.now();
            const ext = videoFile.name.split(".").pop();
            const fileName = `hero-video-${timestamp}.${ext}`;
            updateData.videoUrl = await saveFileLocally(videoFile, "uploads/videos", fileName);
        }

        // Handle image uploads
        const imageFiles = formData.getAll("images") as File[];
        const uploadedImageUrls: string[] = [];

        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                if (file && file.size > 0) {
                    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                    if (!validImageTypes.includes(file.type)) {
                        return NextResponse.json(
                            { error: true, message: `Invalid image type: ${file.type}` } as ApiResponse,
                            { status: 400, headers: corsHeaders }
                        );
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        return NextResponse.json(
                            { error: true, message: "Image size exceeds 5MB" } as ApiResponse,
                            { status: 400, headers: corsHeaders }
                        );
                    }
                    const timestamp = Date.now();
                    const ext = file.name.split(".").pop() || 'jpg';
                    const fileName = `hero-image-${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
                    const savedPath = await saveFileLocally(file, "uploads/images", fileName);
                    uploadedImageUrls.push(savedPath);
                }
            }
        }

        // Handle text fields and image positions
        const dataField = formData.get("data") as string | null;
        if (dataField) {
            try {
                const parsedData = JSON.parse(dataField);
                if (parsedData.hero) {
                    const { title, subtitle, images } = parsedData.hero;

                    if (title !== undefined) updateData.title = title;
                    if (subtitle !== undefined) updateData.subtitle = subtitle;

                    // Handle image positions
                    if (images && Array.isArray(images)) {
                        const newImages = [...existingHero.images];

                        // Replace "new_image" placeholders with uploaded URLs
                        uploadedImageUrls.forEach((url, index) => {
                            const pos = images.indexOf("new_image", index);
                            if (pos !== -1) {
                                newImages[pos] = url;
                            } else {
                                newImages.push(url); // Append if no placeholder
                            }
                        });

                        // Filter out empty placeholders and ensure unique images
                        updateData.images = newImages.filter((img, idx, self) => img && self.indexOf(img) === idx);
                    }
                }
            } catch (error) {
                console.error("JSON parsing error:", error);
                return NextResponse.json(
                    {
                        error: true,
                        message: "Invalid JSON data provided",
                        details: error instanceof Error ? error.message : "Unknown error",
                    } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
        }

        // Merge with existing data
        const finalUpdateData: HeroData = {
            title: updateData.title !== undefined ? updateData.title : existingHero.title,
            subtitle: updateData.subtitle !== undefined ? updateData.subtitle : existingHero.subtitle,
            videoUrl: updateData.videoUrl !== undefined ? updateData.videoUrl : existingHero.videoUrl,
            images: updateData.images !== undefined ? updateData.images : existingHero.images,
        };

        // Ensure images array doesn't exceed 4
        if (finalUpdateData.images.length > 4) {
            finalUpdateData.images = finalUpdateData.images.slice(0, 4);
        }

        const savedSettings = await Settings.findOneAndUpdate(
            {},
            { $set: { hero: finalUpdateData } },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).lean() as SettingsDocument;

        if (!savedSettings) {
            return NextResponse.json(
                { error: true, message: "Failed to save settings" } as ApiResponse,
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            {
                error: false,
                message: "Hero settings updated successfully",
                data: { hero: savedSettings.hero },
            } as ApiResponse,
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error("PATCH Hero Data Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
            { status: 500, headers: corsHeaders }
        );
    }
}
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, response } = await hasAuth(req);

        if (!user || response) {
            return response || NextResponse.json(
                { error: true, message: "Unauthorized" } as ApiResponse,
                { status: 401, headers: corsHeaders }
            );
        }

        if (user.role !== "admin") {
            return NextResponse.json(
                { error: true, message: "Forbidden: Only administrators can manage settings" } as ApiResponse,
                { status: 403, headers: corsHeaders }
            );
        }

        const formData = await req.formData();
        const updateData: HeroData = {
            title: "",
            subtitle: "",
            videoUrl: "",
            images: []
        };

        // Handle video upload
        const videoFile = formData.get("video") as File | null;
        if (videoFile) {
            const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
            if (!validVideoTypes.includes(videoFile.type)) {
                return NextResponse.json(
                    { error: true, message: "Invalid video file type" } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
            if (videoFile.size > 25 * 1024 * 1024) {
                return NextResponse.json(
                    { error: true, message: "Video file size exceeds 25MB" } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
            const timestamp = Date.now();
            const ext = videoFile.name.split(".").pop();
            const fileName = `hero-video-${timestamp}.${ext}`;
            updateData.videoUrl = await saveFileLocally(videoFile, "uploads/videos", fileName);
        }

        // Handle image uploads
        const imageFiles = formData.getAll("images") as File[];
        if (imageFiles && imageFiles.length > 0) {
            if (imageFiles.length > 4) {
                return NextResponse.json(
                    { error: true, message: "Cannot upload more than 4 hero images" } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }

            for (const file of imageFiles) {
                if (file && file.size > 0) {
                    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                    if (!validImageTypes.includes(file.type)) {
                        return NextResponse.json(
                            { error: true, message: `Invalid image type: ${file.type}` } as ApiResponse,
                            { status: 400, headers: corsHeaders }
                        );
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        return NextResponse.json(
                            { error: true, message: "Image size exceeds 5MB" } as ApiResponse,
                            { status: 400, headers: corsHeaders }
                        );
                    }
                    const timestamp = Date.now();
                    const ext = file.name.split(".").pop() || 'jpg';
                    const fileName = `hero-image-${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
                    const savedPath = await saveFileLocally(file, "uploads/images", fileName);
                    updateData.images.push(savedPath);
                }
            }
        }

        // Handle text fields
        const dataField = formData.get("data") as string | null;
        if (dataField) {
            try {
                const parsedData = JSON.parse(dataField);
                if (parsedData.hero) {
                    const { title, subtitle } = parsedData.hero;
                    if (title) updateData.title = title;
                    if (subtitle) updateData.subtitle = subtitle;
                }
            } catch (error) {
                console.error("JSON parsing error:", error);
                return NextResponse.json(
                    {
                        error: true,
                        message: "Invalid JSON data provided",
                        details: error instanceof Error ? error.message : "Unknown error",
                    } as ApiResponse,
                    { status: 400, headers: corsHeaders }
                );
            }
        }

        // Update only the hero section
        const savedSettings = await Settings.findOneAndUpdate(
            {},
            { $set: { hero: updateData } },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).lean() as SettingsDocument;

        if (!savedSettings) {
            return NextResponse.json(
                { error: true, message: "Failed to save settings" } as ApiResponse,
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            {
                error: false,
                message: "Hero settings created successfully",
                data: { hero: savedSettings?.hero || { title: "", subtitle: "", videoUrl: "", images: [] } },
            } as ApiResponse,
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error("POST Hero Data Error:", error);
        return NextResponse.json(
            {
                error: true,
                message: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            } as ApiResponse,
            { status: 500, headers: corsHeaders }
        );
    }
}
