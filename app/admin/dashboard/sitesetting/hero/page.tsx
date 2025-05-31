"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, X, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

export default function HeroPage() {
    const [hero, setHero] = useState<{
        videoUrl?: string;
        title?: string;
        subtitle?: string;
    } | null>(null);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
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
                    console.error("Fetch Hero Error Response:", {
                        status: response.status,
                        statusText: response.statusText,
                        errorData,
                    });
                    throw new Error(errorData.message || `Error: ${response.status}`);
                }

                const result = await response.json();
                if (!result.error && result.data) {
                    // More defensive coding - check if hero exists in the response
                    if (result.data.hero) {
                        setHero({
                            videoUrl: result.data.hero.videoUrl || "",
                            title: result.data.hero.title || "",
                            subtitle: result.data.hero.subtitle || "",
                        });
                        setTitle(result.data.hero.title || "");
                        setSubtitle(result.data.hero.subtitle || "");
                    } else {
                        console.warn("Hero data missing in response:", result);
                        // Set defaults when no hero data exists
                        setHero({ videoUrl: "", title: "", subtitle: "" });
                        setTitle("");
                        setSubtitle("");
                    }
                } else {
                    console.error("API returned error or no data:", result);
                    throw new Error(result.message || "Failed to load hero settings");
                }
            } catch (error) {
                console.error("Error fetching hero settings:", {
                    message: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                    fullError: error
                });
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
    }, [admin, router]);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["video/mp4", "video/webm", "video/ogg"];
        const maxSize = 25 * 1024 * 1024; // 25MB

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

        const extension = file.name.split(".").pop()?.toLowerCase();
        const expectedExtensions = ["mp4", "webm", "ogg"];
        if (extension && !expectedExtensions.includes(extension)) {
            toast.warning("File extension mismatch", {
                description: `The file extension (.${extension}) does not match the expected formats (MP4, WebM, OGG). Ensure the file content matches its extension.`,
            });
        }

        const previewUrl = URL.createObjectURL(file);
        setPreviewVideo(previewUrl);
    };

    const clearPreview = () => {
        setPreviewVideo(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
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

        if (!previewVideo && !title && !subtitle) {
            toast.error("No changes provided", {
                description: "Please provide a video, title, or subtitle to update.",
            });
            return;
        }

        setIsUploading(true);

        try {


            const formData = new FormData();
            if (videoInputRef.current?.files?.[0]) {
                formData.append("video", videoInputRef.current.files[0]);
            }

            // The critical fix - make sure data is formatted correctly for the backend
            formData.append("data", JSON.stringify({
                hero: {
                    title: title.trim(),
                    subtitle: subtitle.trim()
                }
            }));

            const response = await fetch("/api/sitesetting/setting", {
                method: "POST",
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
                console.error("API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                });
                throw new Error(errorData.message || errorData.details || `Error: ${response.status}`);
            }

            const result = await response.json();

            if (result.error === true) {
                throw new Error(result.message || result.details || "Failed to save hero settings");
            }

            // Success path - verify that we got back the data we expected
            if (result.data) {
                // Extract hero data safely with better debugging
                const heroData = result.data.hero || {};

                // If hero data is missing or empty but we know we sent it, fetch fresh data
                if (!heroData || Object.keys(heroData).length === 0) {
                    console.warn("Hero data missing in response. Fetching fresh data...");
                    // Fetch fresh data from API
                    try {
                        const refreshResponse = await fetch("/api/sitesetting/setting", {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${admin.token}`,
                            },
                            cache: "no-store",
                        });

                        if (refreshResponse.ok) {
                            const refreshData = await refreshResponse.json();

                            if (!refreshData.error && refreshData.data?.hero) {
                                // Use the freshly fetched data
                                const freshHeroData = refreshData.data.hero;
                                setHero({
                                    videoUrl: freshHeroData.videoUrl || "",
                                    title: freshHeroData.title || "",
                                    subtitle: freshHeroData.subtitle || "",
                                });
                                setTitle(freshHeroData.title || "");
                                setSubtitle(freshHeroData.subtitle || "");
                            }
                        }
                    } catch (refreshError) {
                        console.error("Error refreshing data:", refreshError);
                    }
                } else {
                    // Update state with data from response, falling back to current values if missing
                    setHero({
                        videoUrl: heroData.videoUrl || hero?.videoUrl || "",
                        title: heroData.title || "",
                        subtitle: heroData.subtitle || "",
                    });

                    setTitle(heroData.title || "");
                    setSubtitle(heroData.subtitle || "");
                }

                clearPreview();
                toast.success(result.message || "Hero settings saved", {
                    description: "Hero settings have been saved successfully.",
                });
            } else {
                console.warn("Success response missing data:", result);
                toast.success("Settings saved", {
                    description: "Your changes have been applied successfully.",
                });

                // Refresh data to ensure we have the latest from the database
                location.reload();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error("Error uploading hero settings:", {
                message: errorMessage,
                errorObject: error,
                stack: error instanceof Error ? error.stack : "No stack trace available",
                formData: {
                    hasVideo: !!videoInputRef.current?.files?.[0],
                    videoType: videoInputRef.current?.files?.[0]?.type,
                    videoSize: videoInputRef.current?.files?.[0]?.size,
                    title,
                    subtitle,
                },
            });

            toast.error("Update failed", {
                description: errorMessage.toLowerCase().includes("video")
                    ? "There was an issue with the video file. Please ensure it's a valid MP4, WebM, or OGG file under 25MB."
                    : errorMessage,
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

    const headingText = hero?.videoUrl || hero?.title || hero?.subtitle ? "Update Hero Section" : "Add Hero Section";
    const buttonText = hero?.videoUrl || hero?.title || hero?.subtitle ? "Update Hero" : "Add Hero";

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Video className="h-6 w-6 text-purple-400" />
                    {headingText}
                </h1>

                <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
                    <div className="mb-6">
                        <h2 className="text-md font-medium text-white/70 mb-2">Current Hero Section</h2>
                        <div className="flex flex-col items-center justify-center bg-slate-800 rounded-lg p-8 min-h-32">
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                            ) : (
                                <>
                                    {hero?.videoUrl ? (
                                        <video
                                            src={hero.videoUrl}
                                            controls
                                            className="max-h-32 object-contain rounded-md"
                                            style={{ maxWidth: "100%" }}
                                        />
                                    ) : (
                                        <p className="text-white/50">No video set</p>
                                    )}
                                    <div className="mt-4 text-center">
                                        <p className="text-white font-medium">{hero?.title || "No title set"}</p>
                                        <p className="text-white/70 text-sm">{hero?.subtitle || "No subtitle set"}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {admin?.role === "admin" ? (
                        <>
                            <div className="mb-6">
                                <h2 className="text-md font-medium text-white/70 mb-2">Upload New Video</h2>
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
                                            onClick={clearPreview}
                                            className="text-white/70 hover:text-red-400 hover:bg-white/10"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-white/50 mt-2">
                                    Accepted formats: MP4, WebM, OGG. Maximum size: 25MB.
                                    Ensure the file extension matches the actual file format.
                                </p>
                            </div>

                            {previewVideo && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-medium text-white/70 mb-2">Video Preview</h2>
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
                                <h2 className="text-md font-medium text-white/70 mb-2">Hero Title</h2>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter hero title"
                                    className="bg-slate-800 border-white/10 text-white"
                                />
                            </div>

                            <div className="mb-6">
                                <h2 className="text-md font-medium text-white/70 mb-2">Hero Subtitle</h2>
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
                                    disabled={isUploading || (!previewVideo && title.trim() === "" && subtitle.trim() === "")}
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