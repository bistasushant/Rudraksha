"use client";
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useMemo,
} from "react";
import { Package, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface IPackage {
  id?: string;
  type: "package";
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

export default function PackagePage() {
  const [packageInfo, setPackageInfo] = useState<IPackage>({
    type: "package",
    title: "",
    description: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { admin } = useAuth();
  const router = useRouter();

  // Check auth and fetch Package info
  useEffect(() => {
    if (admin === null) return; // Auth still loading

    if (!admin?.token) {
      toast.error("Please log in to manage Package info");
      router.push("/admin");
      return;
    }

    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("Unauthorized", {
        description: "Only administrators and editors can manage Package info",
      });
      router.push("/admin/dashboard");
      return;
    }

    const fetchPackageInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/content?type=package", {
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
          const packageData = result.data[0];
          setPackageInfo({
            id: packageData.id,
            type: "package",
            title: packageData.title || "",
            description: packageData.description || "",
            imageUrl: normalizeImageUrl(packageData.image), // Fix URL here
            createdAt: packageData.createdAt,
            updatedAt: packageData.updatedAt,
          });
        } else {
          setPackageInfo({
            type: "package",
            title: "",
            description: "",
          });
        }
      } catch (error) {
        console.error("Error fetching Package info:", error);
        toast.error("Failed to load Package info", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
        setPackageInfo({
          type: "package",
          title: "",
          description: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageInfo();
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
    setPackageInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle RichTextEditor changes
  const handleRichTextChange = (html: string) => {
    setPackageInfo((prev) => ({ ...prev, description: html }));
  };

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PNG, JPEG, JPG, or WebP image",
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

  // Memoized validation without side effects
  const isFormValid = useMemo(() => {
    const title = packageInfo.title.trim();
    const description = packageInfo.description.trim();
    
    return title.length >= 3 && description.length >= 3;
  }, [packageInfo.title, packageInfo.description]);

  // Validate Package info with side effects (for form submission)
  const validatePackageInfo = () => {
    const title = packageInfo.title.trim();
    const description = packageInfo.description.trim();
    
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
        description: "Please log in as an admin or editor to update Package info",
      });
      router.push("/admin");
      return;
    }

    if (!validatePackageInfo()) {
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = packageInfo.imageUrl;

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
        type: "package",
        title: packageInfo.title.trim(),
        description: packageInfo.description.trim(),
        image: imageUrl || "",
      };

      console.log("Sending package payload:", payload);

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
        setPackageInfo({
          id: result.data.id,
          type: "package",
          title: result.data.title || "",
          description: result.data.description || "",
          imageUrl: normalizeImageUrl(result.data.image), // Fix URL here too
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });
        clearImagePreview();
        toast.success("Package updated", {
          description:
            result.message || "Package content updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to update Package info");
      }
    } catch (error) {
      console.error("Error updating Package info:", error);
      toast.error("Failed to update Package info", {
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

  const hasPackageInfo = packageInfo.title.trim() || packageInfo.description.trim();
  const headingText = hasPackageInfo ? "Update Package" : "Add Package";
  const buttonText = hasPackageInfo ? "Update Package" : "Add Package";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-purple-400" />
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
                Package Title
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                value={packageInfo.title}
                onChange={handleInputChange}
                placeholder="e.g., Premium Package"
                className="bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                disabled={isSaving}
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Package Description
              </label>
              <RichTextEditor
                placeholder="Enter package description..."
                value={packageInfo.description}
                onChange={handleRichTextChange}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="image"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Package Image
              </label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="bg-slate-800 border-white/10 text-white file:text-purple-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:bg-purple-500/20 file:hover:bg-purple-500/30 transition-colors"
                  disabled={isSaving}
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearImagePreview}
                    className="text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors"
                    disabled={isSaving}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-white/50 mt-2">
                Accepted formats: PNG, JPEG, JPG, WebP. Maximum size: 5MB.
              </p>
            </div>

            {/* Current Image Preview */}
            {packageInfo.imageUrl && !imagePreview && (
              <div className="mb-6">
                <label className="text-md font-medium text-white/70 mb-2 block">
                  Current Package Image
                </label>
                <div className="flex items-center justify-center gap-2 mt-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <p className="text-sm text-white/60 font-medium">
                          Recommended size: 1536 x 1024 pixels
                        </p>
                      </div>
                <div className="flex items-center justify-center bg-slate-800 rounded-lg p-4">
                  <Image
                    src={packageInfo.imageUrl}
                    alt="Current package image"
                    width={400}
                    height={200}
                    className="max-h-48 object-contain rounded"
                    unoptimized
                    onError={() => {
                      console.error('Image failed to load:', packageInfo.imageUrl);
                    }}
                  />
                </div>
              </div>
            )}

            {/* New Image Preview */}
            {imagePreview && (
              <div className="mb-6">
                <label className="text-md font-medium text-white/70 mb-2 block">
                  New Package Image Preview
                </label>
                <div className="flex items-center justify-center bg-slate-800 rounded-lg p-4">
                  <Image
                    src={imagePreview}
                    alt="Package image preview"
                    width={400}
                    height={200}
                    className="max-h-48 object-contain rounded"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !isFormValid}
                className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {isSaving ? "Saving..." : buttonText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}