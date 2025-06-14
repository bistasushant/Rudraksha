import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { ApiResponse, PlainSettings } from "@/types";
import { uploadImage } from "@/lib/imageUpload";
import { saveFileLocally } from "@/lib/fileSave";
import { hasAuth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne().lean() as PlainSettings | null;

    // Ensure hero data is properly structured in the response
    const responseData = settings || {
      hero: { title: "", subtitle: "", videoUrl: "", images: [] },
    };

    return NextResponse.json(
      {
        error: false,
        message: settings ? "Settings retrieved successfully" : "No settings found",
        data: responseData,
      } as ApiResponse<PlainSettings>,
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("GET Settings Error:", error);
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
    interface UpdateData {
      hero?: {
        title: string;
        subtitle: string;
        videoUrl: string;
        images?: string[];
        createdAt: Date;
        updatedAt: Date;
      };
      logo?: { url: string; createdAt: Date };
      currency?: { currency: string; updatedAt: Date };
      title?: { title: string; updatedAt: Date };
      googleAnalytics?: { trackingId: string; updatedAt: Date };
    }
    const updateData: UpdateData = {};

    // Initialize hero object
    updateData.hero = {
      title: "",
      subtitle: "",
      videoUrl: "",
      images: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const logoFile = formData.get("logo") as File | null;
    if (logoFile) {
      const uploadResult = await uploadImage(logoFile);
      updateData.logo = {
        url: uploadResult.url,
        createdAt: new Date()
      };
    }

    // Handle hero video upload
    const videoFile = formData.get("video") as File | null;
    let videoUrl: string | undefined;
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
      videoUrl = await saveFileLocally(videoFile, "uploads/videos", fileName);
    }

    // Handle hero images upload
    const imageFiles = formData.getAll("images") as File[];
    const uploadedImageUrls: string[] = [];

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
          uploadedImageUrls.push(savedPath);
        }
      }
    }

    // Handle text fields
    const dataField = formData.get("data") as string | null;
    if (dataField) {
      try {
        const parsedData = JSON.parse(dataField);

        // Handle currency
        if (parsedData.currency) {
          updateData.currency = {
            currency: parsedData.currency,
            updatedAt: new Date()
          };
        }

        // Handle title
        if (parsedData.title) {
          updateData.title = {
            title: parsedData.title,
            updatedAt: new Date()
          };
        }

        // Handle Google Analytics
        if (parsedData.googleAnalytics) {
          updateData.googleAnalytics = {
            trackingId: parsedData.googleAnalytics,
            updatedAt: new Date()
          };
        }

        // Handle hero section
        if (parsedData.hero) {
          const { title, subtitle } = parsedData.hero;

          // Validate hero title
          if (title && (typeof title !== "string" || title.length > 100)) {
            return NextResponse.json(
              { error: true, message: "Invalid hero title: must be a string and at most 100 characters" } as ApiResponse,
              { status: 400, headers: corsHeaders }
            );
          }

          // Validate hero subtitle
          if (subtitle && (typeof subtitle !== "string" || subtitle.length > 500)) {
            return NextResponse.json(
              { error: true, message: "Invalid hero subtitle: must be a string and at most 500 characters" } as ApiResponse,
              { status: 400, headers: corsHeaders }
            );
          }

          // Create hero update object
          updateData.hero = {
            title: title || "",
            subtitle: subtitle || "",
            videoUrl: videoUrl || parsedData.hero.videoUrl || "",
            images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (parsedData.hero.images || []),
            createdAt: new Date(),
            updatedAt: new Date()
          };
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: true, message: "No valid update data provided" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Use findOneAndUpdate with proper options

    const savedSettings = await Settings.findOneAndUpdate(
      {}, // Find any document (there should be only one settings document)
      { $set: updateData }, // Use $set to update only specified fields
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none exists
        runValidators: true // Run schema validators on update
      }
    ).lean();

    if (!savedSettings) {
      return NextResponse.json(
        { error: true, message: "Failed to save settings" } as ApiResponse,
        { status: 500, headers: corsHeaders }
      );
    }


    return NextResponse.json(
      {
        error: false,
        message: "Settings updated successfully",
        data: savedSettings,
      } as ApiResponse<PlainSettings>,
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST Settings Error:", error);
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
