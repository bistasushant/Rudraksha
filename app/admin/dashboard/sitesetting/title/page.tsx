"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Type, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

export default function TitlePage() {
  const [title, setTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { admin } = useAuth();
  const router = useRouter();

  // Fetch current title on mount
  useEffect(() => {
    const fetchTitle = async () => {
      if (!admin?.token) {
        return; // Wait for auth to initialize
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/setting/title", {
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
        // Update the property path to match the API response structure
        if (!result.error && result.data?.title?.title) {
          setTitle(result.data.title.title);
        } else {
          setTitle(""); // No title exists, allow user to add one
        }
      } catch (error) {
        console.error("Error fetching title:", error);
        toast.error("Failed to load title", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (admin?.token) {
      fetchTitle();
    }
  }, [admin?.token, router]);

  // Handle authentication and authorization
  useEffect(() => {
    if (admin === null) {
      return; // Still loading auth
    }

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

  // Handle title input change
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token) {
      toast.error("Authentication required", {
        description: "Please log in to save the title.",
      });
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can manage the site title.",
      });
      return;
    }

    if (!title.trim()) {
      toast.error("Invalid title", {
        description: "Please enter a valid site title.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ siteTitle: title.trim() }));

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
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      // Update the property path to match the API response structure
      if (!result.error) {
        // Check if the title was set in the response
        if (result.data?.title?.title) {
          setTitle(result.data.title.title);
        }
        toast.success("Title saved", {
          description: result.message || "Site title saved successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to save title");
      }
    } catch (error) {
      console.error("Error saving title:", error);
      toast.error("Failed to save title", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (admin === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Type className="h-6 w-6 text-purple-400" />
          Manage Site Title
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              Loading title settings...
            </div>
          ) : admin.role !== "admin" ? (
            <p className="text-white/50 mb-6">
              Only administrators can manage the site title.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Site Title */}
              <div className="mb-6">
                <label
                  htmlFor="title"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Site Title
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter site title"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSaving || isLoading}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || isLoading || !title.trim()}
                  className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  Save Title
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
