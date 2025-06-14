import cloudinary from "@/lib/cloudinary";

export interface UploadResult {
  url: string;
  public_id: string;
}

export async function uploadImage(
  file: File,
  existingPublicId?: string
): Promise<UploadResult> {
  try {
    // If there's an existing logo, delete it from Cloudinary
    if (existingPublicId) {
      try {
        await cloudinary.uploader.destroy(existingPublicId);
      } catch (deleteError) {
        console.error("Error deleting existing Cloudinary image:", {
          message:
            deleteError instanceof Error
              ? deleteError.message
              : "Unknown error",
          stack: deleteError instanceof Error ? deleteError.stack : undefined,
        });
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "logos",
          resource_type: "image",
          allowed_formats: ["png", "jpg", "jpeg", "svg", "avif"], // Added avif
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary stream error:", {
              message: error.message || "Unknown error",
              details: error,
              fileDetails: {
                name: file.name,
                type: file.type,
                size: file.size,
              },
            });
            return reject(
              new Error(
                `Cloudinary upload failed: ${error.message || "Unknown error"}`
              )
            );
          }
          if (!result) {
            console.error("Cloudinary upload failed: No result returned");
            return reject(new Error("Upload failed, no result returned"));
          }

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
      uploadStream.on("error", (streamError) => {
        console.error("Cloudinary upload stream error:", {
          message: streamError.message || "Unknown stream error",
          details: streamError,
          fileDetails: { name: file.name, type: file.type, size: file.size },
        });
        reject(
          new Error(`Stream error: ${streamError.message || "Unknown error"}`)
        );
      });
      uploadStream.end(buffer);
    });

    return uploadResult;
  } catch (error) {
    console.error("Cloudinary Upload Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      fileDetails: { name: file.name, type: file.type, size: file.size },
    });
    throw new Error(
      `Failed to upload image to Cloudinary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
