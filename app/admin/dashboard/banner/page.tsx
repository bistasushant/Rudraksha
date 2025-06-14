"use client";
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { Image as ImageIcon, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface IBanner {
  id?: string;
  type: "banner";
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper function to normalize image URLs
const normalizeImageUrl = (url: string | undefined): string => {
  if (!url) return "";
  
  // If it's already a complete URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Fix the invalid "uploads" hostname issue
    if (url.includes('://uploads/')) {
      // Convert to relative path or use your actual domain
      return url.replace('https://uploads/', '/uploads/');
    }
    return url;
  }
  
  // If it's a relative path, ensure it starts with /
  if (!url.startsWith('/')) {
    return `/${url}`;
  }
  
  return url;
};

export default function BannerPage() {
  const [bannerInfo, setBannerInfo] = useState<IBanner>({
    type: "banner",
    title: "",
    description: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { admin } = useAuth();
  const router = useRouter();

  // Check auth and fetch Banner info
  useEffect(() => {
    if (admin === null) return; // Auth still loading

    if (!admin?.token) {
      toast.error("Please log in to manage Banner info");
      router.push("/admin");
      return;
    }

    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("Unauthorized", {
        description: "Only administrators and editors can manage Banner info",
      });
      router.push("/admin/dashboard");
      return;
    }

    const fetchBannerInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/content?type=banner", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          toast.error("Session expired", {
            description: "Please log in again to continue",
          });
          router.push("/admin");
          return;
        }

        if (response.status === 403) {
          toast.error("Unauthorized", {
            description: "Only administrators and editors can access this page",
          });
          router.push("/admin/dashboard");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.error && result.data && result.data.length > 0) {
          const bannerData = result.data[0];
          setBannerInfo({
            id: bannerData.id,
            type: "banner",
            title: bannerData.title || "",
            description: bannerData.description || "",
            imageUrl: normalizeImageUrl(bannerData.image), // Fix URL here
            createdAt: bannerData.createdAt,
            updatedAt: bannerData.updatedAt,
          });
        } else {
          setBannerInfo({
            type: "banner",
            title: "",
            description: "",
          });
        }
      } catch (error) {
        console.error("Error fetching Banner info:", error);
        toast.error("Failed to load Banner info", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
        setBannerInfo({
          type: "banner",
          title: "",
          description: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerInfo();
  }, [admin, router]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBannerInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle RichTextEditor changes
  const handleRichTextChange = (html: string) => {
    setBannerInfo((prev) => ({ ...prev, description: html }));
  };

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PNG or JPEG image",
      });
      return;
    }
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // Clear image preview
  const clearImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validate Banner info
  const isValidBannerInfo = () => {
    const title = bannerInfo.title.trim();
    const description = bannerInfo.description.trim();
    
    // Check title length (minimum 3 characters)
    if (title.length < 3) {
      toast.error("Invalid title", {
        description: "Title must be at least 3 characters long",
      });
      return false;
    }

    // Check description length (minimum 3 characters)
    if (description.length < 3) {
      toast.error("Invalid description", {
        description: "Description must be at least 3 characters long",
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("Authentication required", {
        description: "Please log in as an admin or editor to update Banner info",
      });
      router.push("/admin");
      return;
    }

    if (!isValidBannerInfo()) {
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = bannerInfo.imageUrl;

      // If there's a new image file, upload it first
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append("image", fileInputRef.current.files[0]);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to upload image");
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.error) {
          throw new Error(uploadResult.message || "Failed to upload image");
        }

        // Normalize the uploaded URL
        const uploadedUrl = uploadResult.data?.imageUrl;
        if (uploadedUrl) {
          imageUrl = normalizeImageUrl(uploadedUrl);
        }
      }

      // Create JSON payload with the updated image URL
      const payload = {
        type: "banner",
        title: bannerInfo.title.trim(),
        description: bannerInfo.description.trim(),
        image: imageUrl || "",
      };

      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (response.status === 401) {
        toast.error("Session expired", {
          description: "Please log in again to continue",
        });
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.error && result.data) {
        setBannerInfo({
          id: result.data.id,
          type: "banner",
          title: result.data.title || "",
          description: result.data.description || "",
          imageUrl: normalizeImageUrl(result.data.image), // Fix URL here too
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });
        clearImagePreview();
        toast.success("Banner updated", {
          description:
            result.message || "Banner content updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to update Banner info");
      }
    } catch (error) {
      console.error("Error updating Banner info:", error);
      toast.error("Failed to update Banner info", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while auth or data is fetching
  if (admin === null || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Only render for admins and editors
  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null; // Redirect handled in useEffect
  }

  const hasBannerInfo = bannerInfo.title.trim() || bannerInfo.description.trim();
  const headingText = hasBannerInfo ? "Update Banner" : "Add Banner";
  const buttonText = hasBannerInfo ? "Update Banner" : "Add Banner";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Title
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                value={bannerInfo.title}
                onChange={handleInputChange}
                placeholder="e.g., Welcome to Our Store"
                className="bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Description
              </label>
              <RichTextEditor
                placeholder="Enter banner description"
                value={bannerInfo.description}
                onChange={handleRichTextChange}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="image"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Banner Image
              </label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="bg-slate-800 border-white/10 text-white file:text-purple-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:bg-purple-500/20 file:hover:bg-purple-500/30"
                  disabled={isSaving}
                />
                {imagePreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearImagePreview}
                    className="text-white/70 hover:text-red-400 hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-white/50 mt-2">
                Accepted formats: PNG, JPEG. Maximum size: 5MB.
              </p>
            </div>

            {/* Current Image Preview */}
            {bannerInfo.imageUrl && (
              <div className="mb-6">
                <label className="text-md font-medium text-white/70 mb-2 block">
                  Current Banner Image
                </label>
                <div className="flex items-center justify-center gap-2 mt-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <p className="text-sm text-white/60 font-medium">
                          Recommended size: 1024 x 1024 pixels
                        </p>
                      </div>
                <div className="flex items-center justify-center bg-slate-800 rounded-lg p-4">
                  <Image
                    src={bannerInfo.imageUrl}
                    alt="Current banner image"
                    width={400}
                    height={200}
                    className="max-h-48 object-contain"
                    unoptimized
                    onError={() => {
                      console.error('Image failed to load:', bannerInfo.imageUrl);
                      // You could set a fallback image here
                    }}
                  />
                </div>
              </div>
            )}

            {/* Uploaded Image Preview */}
            {imagePreview && (
              <div className="mb-6">
                <label className="text-md font-medium text-white/70 mb-2 block">
                  Image Preview
                </label>
                <div className="flex items-center justify-center bg-slate-800 rounded-lg p-4">
                  <Image
                    src={imagePreview}
                    alt="Banner image preview"
                    width={400}
                    height={200}
                    className="max-h-48 object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !isValidBannerInfo()}
                className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {buttonText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}