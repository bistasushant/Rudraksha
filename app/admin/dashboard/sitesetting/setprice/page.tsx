"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { DollarSign, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

export default function SetPricePage() {
  const [currency, setCurrency] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { admin } = useAuth();
  const router = useRouter();

  // Fetch current currency on mount
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!admin?.token) {
        return; // Wait for auth to initialize
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/setting/currency", {
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
        if (!result.error && result.data?.currency?.currency) {
          setCurrency(result.data.currency.currency);
        } else if (result.data === null || !result.data?.currency?.currency) {
          setCurrency(""); // No currency set
        } else {
          throw new Error(result.message || "Failed to fetch currency");
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
        toast.error("Failed to load currency", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
        setCurrency(""); // Fallback to empty state
      } finally {
        setIsLoading(false);
      }
    };

    if (admin) {
      fetchCurrency();
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

  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token) {
      toast.error("Authentication required", {
        description: "Please log in to update currency.",
      });
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can manage currency settings.",
      });
      return;
    }

    if (!currency) {
      toast.error("Invalid currency", {
        description: "Please select a currency.",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create FormData with currency data
      const formData = new FormData();
      formData.append("data", JSON.stringify({ currency }));

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
        // Check if currency was returned in the response
        if (result.data?.currency?.currency) {
          setCurrency(result.data.currency.currency);
        }
        toast.success("Currency updated", {
          description:
            result.message || "Currency setting updated successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to update currency");
      }
    } catch (error) {
      console.error("Error updating currency:", error);
      toast.error("Failed to update currency", {
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

  const headingText = currency ? "Update Currency" : "Add Currency";
  const buttonText = currency ? "Update Currency" : "Add Currency";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              Loading currency settings...
            </div>
          ) : admin.role !== "admin" ? (
            <p className="text-white/50 mb-6">
              Only administrators can manage currency settings.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Currency */}
              <div className="mb-6">
                <label
                  htmlFor="currency"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Currency
                </label>
                <Select
                  value={currency}
                  onValueChange={handleCurrencyChange}
                  disabled={isSaving || isLoading}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="NPR">Nepali Rupee (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || isLoading || !currency}
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
