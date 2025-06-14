"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Phone, Check, Mail, MapPin, Map, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

interface ContactData {
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl: string;
}

export default function ContactUsPage() {
  const { admin } = useAuth();
  const [contactInfo, setContactInfo] = useState<ContactData>({
    email: "",
    phone: "",
    address: "",
    mapEmbedUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Combined auth check and fetch
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (admin === null) return; // Auth still loading

      if (!admin?.token) {
        toast.error("Please log in to access this page");
        router.push("/admin");
        return;
      }

      if (admin.role !== "admin") {
        toast.error("Unauthorized", {
          description: "Only administrators can access this page",
        });
        router.push("/admin/dashboard");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/contact", {
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
        if (!result.error && result.data) {
          setContactInfo({
            email: result.data.email || "",
            phone: result.data.phone || "",
            address: result.data.address || "",
            mapEmbedUrl: result.data.mapEmbedUrl || "",
          });
        } else {
          throw new Error(result.message || "Failed to fetch contact info");
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
        toast.error("Failed to load contact info", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
        setContactInfo({
          email: "",
          phone: "",
          address: "",
          mapEmbedUrl: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [admin, router]);

  // Handle input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Validate contact info
  const isValidContactInfo = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{1,4}[\s-]?\d{7,}$/;
    const mapUrlRegex = /^(https?:\/\/(www\.)?google\.com\/maps\/embed\?.*)$/i;
    return (
      emailRegex.test(contactInfo.email.trim()) &&
      phoneRegex.test(contactInfo.phone.trim()) &&
      contactInfo.address.trim().length > 0 &&
      (contactInfo.mapEmbedUrl.trim() === "" ||
        mapUrlRegex.test(contactInfo.mapEmbedUrl.trim()))
    );
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!admin?.token || admin.role !== "admin") {
      toast.error("Authentication required", {
        description: "Please log in as an admin to update contact info.",
      });
      router.push("/admin");
      return;
    }

    if (!isValidContactInfo()) {
      toast.error("Invalid contact information", {
        description:
          "Please enter a valid email, phone number, address, and map embed URL (if provided).",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/sitesetting/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({
          email: contactInfo.email.trim(),
          phone: contactInfo.phone.trim(),
          address: contactInfo.address.trim(),
          mapEmbedUrl: contactInfo.mapEmbedUrl.trim(),
        }),
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
        setContactInfo({
          email: result.data.email || "",
          phone: result.data.phone || "",
          address: result.data.address || "",
          mapEmbedUrl: result.data.mapEmbedUrl || "",
        });
        toast.success("Contact info updated", {
          description:
            result.message || "Contact information updated successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to update contact info");
      }
    } catch (error) {
      console.error("Error updating contact info:", error);
      toast.error("Failed to update contact info", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || admin === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const hasContactInfo =
    contactInfo.email.trim() ||
    contactInfo.phone.trim() ||
    contactInfo.address.trim() ||
    contactInfo.mapEmbedUrl.trim();
  const headingText = hasContactInfo
    ? "Update Contact Information"
    : "Add Contact Information";
  const buttonText = hasContactInfo
    ? "Update Contact Info"
    : "Add Contact Info";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Phone className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          {admin.role !== "admin" ? (
            <p className="text-white/50 mb-6">
              Only administrators can manage contact settings.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleInputChange}
                    placeholder="e.g., support@example.com"
                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +977 123-456-7890"
                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label
                  htmlFor="address"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 h-5 w-5 text-white/50" />
                  <Textarea
                    id="address"
                    name="address"
                    value={contactInfo.address}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Store St, City, Country"
                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Map Embed URL */}
              <div className="mb-6">
                <label
                  htmlFor="mapEmbedUrl"
                  className="text-md font-medium text-white/70 mb-2 block"
                >
                  Google Maps Embed URL (Optional)
                </label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="mapEmbedUrl"
                    name="mapEmbedUrl"
                    type="url"
                    value={contactInfo.mapEmbedUrl}
                    onChange={handleInputChange}
                    placeholder="e.g., https://www.google.com/maps/embed?..."
                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || !isValidContactInfo()}
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
