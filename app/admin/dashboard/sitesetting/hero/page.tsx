"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, X, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

interface HeroData {
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  images?: string[];
}

export default function HeroPage() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>(
    Array(4).fill("")
  );
  const [selectedImageFiles, setSelectedImageFiles] = useState<(File | null)[]>(
    Array(4).fill(null)
  );
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { admin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchHero = async () => {
      if (!admin?.token) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/setting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          toast.error("Unauthorized access", {
            description: "Please log in again to continue.",
          });
          router.push("/admin");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.error && result.data?.hero) {
          setHero({
            videoUrl: result.data.hero.videoUrl || "",
            title: result.data.hero.title || "",
            subtitle: result.data.hero.subtitle || "",
            images: result.data.hero.images || [],
          });
          setTitle(result.data.hero.title || "");
          setSubtitle(result.data.hero.subtitle || "");
          setPreviewImages([
            ...(result.data.hero.images || []),
            ...Array(4 - (result.data.hero.images?.length || 0)).fill(""),
          ]);
        } else {
          setHero({ videoUrl: "", title: "", subtitle: "", images: [] });
          setTitle("");
          setSubtitle("");
          setPreviewImages(Array(4).fill(""));
        }
      } catch (error) {
        console.error("Error fetching hero settings:", error);
        toast.error("Failed to load hero settings", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (admin) fetchHero();
  }, [admin, router]);

  useEffect(() => {
    if (admin === null) return;

    if (!admin?.token) {
      toast.error("Please log in to access this page");
      router.push("/admin");
      return;
    }

    if (admin?.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can access this page",
      });
      router.push("/admin/dashboard");
    }

    return () => {
      if (previewVideo) URL.revokeObjectURL(previewVideo);
      previewImages.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [admin, router, previewVideo, previewImages]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["video/mp4", "video/webm", "video/ogg"];
    const maxSize = 25 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload an MP4, WebM, or OGG video.",
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload a video smaller than 25MB.",
      });
      return;
    }

    if (previewVideo) URL.revokeObjectURL(previewVideo);
    const previewUrl = URL.createObjectURL(file);
    setPreviewVideo(previewUrl);
  };

  const handleImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid image type", {
        description: "Please upload JPEG or PNG images.",
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error("Image too large", {
        description: "Each image must be smaller than 5MB.",
      });
      return;
    }

    const newFiles = [...selectedImageFiles];
    const newPreviews = [...previewImages];

    if (newFiles[index]) {
      // Replace existing file
      if (newPreviews[index].startsWith("blob:")) {
        URL.revokeObjectURL(newPreviews[index]);
      }
    }

    newFiles[index] = file;
    newPreviews[index] = URL.createObjectURL(file);

    setSelectedImageFiles(newFiles);
    setPreviewImages(newPreviews);
  };

  const clearVideoPreview = () => {
    if (previewVideo) URL.revokeObjectURL(previewVideo);
    setPreviewVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const clearImagePreview = (index: number) => {
    const newFiles = [...selectedImageFiles];
    const newPreviews = [...previewImages];

    if (newPreviews[index] && newPreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index]);
    }

    newFiles[index] = null;
    newPreviews[index] = hero?.images?.[index] || "";

    setSelectedImageFiles(newFiles);
    setPreviewImages(newPreviews);
  };

  const handleSave = async () => {
    if (!admin?.token) {
      toast.error("Authentication required", {
        description: "Please log in to update hero settings.",
      });
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can manage hero settings.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      if (videoInputRef.current?.files?.[0]) {
        formData.append("video", videoInputRef.current.files[0]);
      }

      // Append image files
      selectedImageFiles.forEach((file) => {
        if (file) {
          formData.append("images", file);
        }
      });

      // Prepare hero data, preserving existing images
      const allImages = [...(hero?.images || [])];
      selectedImageFiles.forEach((file, index) => {
        if (file) {
          allImages[index] = "new_image"; // Placeholder for new uploads
        }
      });

      const heroData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        videoUrl: previewVideo || hero?.videoUrl || "",
        images: allImages.filter((img) => img), // Remove empty entries
      };

      formData.append(
        "data",
        JSON.stringify({
          hero: heroData,
        })
      );

      const response = await fetch("/api/sitesetting/setting/hero", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        body: formData,
        cache: "no-store",
      });

      if (response.status === 401) {
        toast.error("Session expired", {
          description: "Please log in again to continue.",
        });
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.details || `Error: ${response.status}`
        );
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(
          result.message || result.details || "Failed to save hero settings"
        );
      }

      if (result.data?.hero) {
        setHero({
          videoUrl: result.data.hero.videoUrl || "",
          title: result.data.hero.title || "",
          subtitle: result.data.hero.subtitle || "",
          images: result.data.hero.images || [],
        });
        setTitle(result.data.hero.title || "");
        setSubtitle(result.data.hero.subtitle || "");
        setPreviewImages([
          ...(result.data.hero.images || []),
          ...Array(4 - (result.data.hero.images?.length || 0)).fill(""),
        ]);
        setSelectedImageFiles(Array(4).fill(null));
        clearVideoPreview();
        toast.success("Hero settings saved successfully");
      }
    } catch (error) {
      console.error("Error uploading hero settings:", error);
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const headingText =
    hero?.videoUrl || hero?.title || hero?.subtitle || hero?.images?.length
      ? "Update Hero Section"
      : "Add Hero Section";
  const buttonText =
    hero?.videoUrl || hero?.title || hero?.subtitle || hero?.images?.length
      ? "Update Hero"
      : "Add Hero";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Video className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-md font-medium text-white/70 mb-2">
              Current Hero Section
            </h2>
            <div className="flex flex-col items-center justify-center bg-slate-800 rounded-lg p-8 min-h-32">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              ) : (
                <>
                  {hero?.videoUrl || previewVideo ? (
                    <video
                      src={previewVideo || hero?.videoUrl}
                      controls
                      className="max-h-32 object-contain rounded-md"
                      style={{ maxWidth: "100%" }}
                    />
                  ) : (
                    <p className="text-white/50">No video set</p>
                  )}
                  <div className="mt-4 text-center">
                    <p className="text-white font-medium">
                      {title || hero?.title || "No title set"}
                    </p>
                    <p className="text-white/70 text-sm">
                      {subtitle || hero?.subtitle || "No subtitle set"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {admin?.role === "admin" ? (
            <>
              <div className="mb-6">
                <h2 className="text-md font-medium text-white/70 mb-2">
                  Upload New Video
                </h2>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoChange}
                    ref={videoInputRef}
                    className="bg-slate-800 border-white/10 text-white text-md file:text-purple-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-md file:bg-purple-500/20 file:hover:bg-purple-500/30"
                  />
                  {previewVideo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearVideoPreview}
                      className="text-white/70 hover:text-red-400 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Accepted formats: MP4, WebM, OGG. Maximum size: 25MB.
                </p>
              </div>

              {previewVideo && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-white/70 mb-2">
                    Video Preview
                  </h2>
                  <div className="flex items-center justify-center bg-slate-800 rounded-lg p-8">
                    <video
                      src={previewVideo}
                      controls
                      className="max-h-32 object-contain rounded-md"
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-md font-medium text-white/70 mb-2">
                  Upload Hero Images (Max 4)
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <p className="text-sm text-white/60 font-medium">
                    Recommended size: 1909 x 945 pixels
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => handleImageChange(index, e)}
                          className="bg-slate-800 border-white/10 text-white text-md file:text-purple-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-md file:bg-purple-500/20 file:hover:bg-purple-500/30"
                        />
                        {previewImages[index] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => clearImagePreview(index)}
                            className="text-white/70 hover:text-red-400 hover:bg-white/10"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                      {previewImages[index] && (
                        <div className="mt-2">
                          <NextImage
                            src={previewImages[index]}
                            alt={`Preview image ${index + 1}`}
                            width={150}
                            height={100}
                            className="object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Accepted formats: JPEG, PNG. Maximum size: 5MB per image.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-md font-medium text-white/70 mb-2">
                  Hero Title
                </h2>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter hero title"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>

              <div className="mb-6">
                <h2 className="text-md font-medium text-white/70 mb-2">
                  Hero Subtitle
                </h2>
                <Textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Enter hero subtitle"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  {buttonText}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-white/50 mb-6">
              Only administrators can update hero settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
