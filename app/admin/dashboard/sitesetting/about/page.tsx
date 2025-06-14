"use client";
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { Info, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";
import { IAbout } from "@/types";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function AboutUsPage() {
  const [aboutInfo, setAboutInfo] = useState<IAbout>({
    title: "",
    description: "",
    imageUrl: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { admin } = useAuth();
  const router = useRouter();

  // Check auth and fetch About Us info
  useEffect(() => {
    if (admin === null) return; // Auth still loading

    if (!admin?.token) {
      toast.error("Please log in to manage About Us info");
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can manage About Us info",
      });
      router.push("/admin/dashboard");
      return;
    }

    const fetchAboutInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/about", {
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
            description: "Only administrators can access this page",
          });
          router.push("/admin/dashboard");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.error && result.data) {
          setAboutInfo({
            title: result.data.title || "",
            description: result.data.description || "",
            imageUrl: result.data.imageUrl || "",
          });
        } else {
          throw new Error(result.message || "Failed to fetch About Us info");
        }
      } catch (error) {
        console.error("Error fetching About Us info:", error);
        toast.error("Failed to load About Us info", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
        setAboutInfo({ title: "", description: "", imageUrl: "" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutInfo();
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
    setAboutInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle RichTextEditor changes
  const handleRichTextChange = (html: string) => {
    setAboutInfo((prev) => ({ ...prev, description: html }));
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

  // Validate About Us info
  const isValidAboutInfo = () => {
    return (
      aboutInfo.title.trim().length > 0 &&
      aboutInfo.description.trim().length > 0
    );
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token || admin.role !== "admin") {
      toast.error("Authentication required", {
        description: "Please log in as an admin to update About Us info",
      });
      router.push("/admin");
      return;
    }

    if (!isValidAboutInfo()) {
      toast.error("Invalid input", {
        description: "Please enter a valid title and description",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", aboutInfo.title.trim());
      formData.append("description", aboutInfo.description.trim());
      if (fileInputRef.current?.files?.[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }

      const response = await fetch("/api/sitesetting/about", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        body: formData,
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
        setAboutInfo({
          title: result.data.title || "",
          description: result.data.description || "",
          imageUrl: result.data.imageUrl || "",
        });
        clearImagePreview();
        toast.success("About Us updated", {
          description:
            result.message || "About Us content updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to update About Us info");
      }
    } catch (error) {
      console.error("Error updating About Us info:", error);
      toast.error("Failed to update About Us info", {
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

  // Only render for admins
  if (!admin?.token || admin.role !== "admin") {
    return null; // Redirect handled in useEffect
  }

  const hasAboutInfo = aboutInfo.title.trim() || aboutInfo.description.trim();
  const headingText = hasAboutInfo ? "Update About Us" : "Add About Us";
  const buttonText = hasAboutInfo ? "Update About Us" : "Add About Us";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Info className="h-6 w-6 text-purple-400" />
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
                value={aboutInfo.title}
                onChange={handleInputChange}
                placeholder="e.g., About SushantStore"
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
                placeholder="Enter About Us description"
                value={aboutInfo.description}
                onChange={handleRichTextChange}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="image"
                className="text-md font-medium text-white/70 mb-2 block"
              >
                Image (Optional)
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
            {aboutInfo.imageUrl && (
              <div className="mb-6">
                <label className="text-md font-medium text-white/70 mb-2 block">
                  Current Image
                </label>
                <div className="flex items-center justify-center gap-2 mt-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <p className="text-sm text-white/60 font-medium">
                    Recommended size: 1280 x 720 pixels
                  </p>
                </div>
                <div className="flex items-center justify-center bg-slate-800 rounded-lg p-4">
                  <Image
                    src={aboutInfo.imageUrl}
                    alt="Current About Us image"
                    width={200}
                    height={80}
                    className="max-h-32 object-contain"
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
                    alt="About Us image preview"
                    width={200}
                    height={80}
                    className="max-h-32 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !isValidAboutInfo()}
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
