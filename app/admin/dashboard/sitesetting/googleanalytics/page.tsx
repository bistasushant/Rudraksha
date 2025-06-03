"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { BarChart3, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

export default function GoogleAnalyticsPage() {
  const [trackingId, setTrackingId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { admin } = useAuth();
  const router = useRouter();

  // Fetch current tracking ID on mount
  useEffect(() => {
    const fetchTrackingId = async () => {
      if (!admin?.token) {
        return; // Wait for auth to initialize
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/setting/google-analytics", {
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
        if (!result.error && result.data?.googleAnalytics?.trackingId) {
          setTrackingId(result.data.googleAnalytics.trackingId);
        } else if (
          result.data === null ||
          !result.data?.googleAnalytics?.trackingId
        ) {
          setTrackingId("");
        } else {
          throw new Error(result.message || "Failed to fetch tracking ID");
        }
      } catch (error) {
        console.error("Error fetching tracking ID:", error);
        toast.error("Failed to load tracking ID", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (admin) {
      fetchTrackingId();
    }
  }, [admin, router]);

  // Redirect if not authenticated or not admin
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

  // Validate format (e.g., G-XXXXXXXXXX)
  const isValidTrackingId = (id: string) => {
    const regex = /^G-[A-Z0-9]{10}$/;
    return regex.test(id.trim());
  };

  // Handle tracking ID input change
  const handleTrackingIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTrackingId(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token) {
      toast.error("Authentication required", {
        description: "Please log in to update tracking ID.",
      });
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description:
          "Only administrators can manage Google Analytics settings.",
      });
      return;
    }

    if (!trackingId.trim()) {
      toast.error("Tracking ID required", {
        description: "Please enter a Google Analytics tracking ID.",
      });
      return;
    }

    if (!isValidTrackingId(trackingId)) {
      toast.error("Invalid tracking ID format", {
        description: "Please enter a valid format like G-XXXXXXXXXX.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({ googleAnalytics: { trackingId: trackingId.trim() } })
      );

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
      if (!result.error) {
        setTrackingId(result.data.googleAnalytics.trackingId);
        toast.success("Tracking ID updated", {
          description: result.message || "Tracking ID updated successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to update tracking ID");
      }
    } catch (error) {
      console.error("Error updating tracking ID:", error);
      toast.error("Failed to update tracking ID", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const headingText = trackingId.trim()
    ? "Update Google Analytics Tracking ID"
    : "Add Google Analytics Tracking ID";
  const buttonText = trackingId.trim()
    ? "Update Tracking ID"
    : "Add Tracking ID";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              Loading Google Analytics settings...
            </div>
          ) : admin.role !== "admin" ? (
            <p className="text-white/50 mb-6">
              Only administrators can manage Google Analytics settings.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Tracking ID Input */}
              <div className="mb-6">
                <label
                  htmlFor="trackingId"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Google Analytics Tracking ID
                </label>
                <Input
                  id="trackingId"
                  type="text"
                  value={trackingId}
                  onChange={handleTrackingIdChange}
                  placeholder="e.g., G-XXXXXXXXXX"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isSaving || isLoading}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    isSaving ||
                    isLoading ||
                    !trackingId.trim() ||
                    !isValidTrackingId(trackingId)
                  }
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
          )}
        </div>
      </div>
    </div>
  );
}
