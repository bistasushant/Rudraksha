"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const EditCountryForm = () => {
  const router = useRouter();
  const [countryName, setCountryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { admin } = useAuth();

  const [formErrors, setFormErrors] = useState<{
    countryName: string;
    general: string;
  }>({
    countryName: "",
    general: "",
  });

  const params = useParams();
  const countryId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/country/country");
      return;
    }
    const fetchCountry = async () => {
      if (!countryId) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No country Id provided in URL",
        }));
        router.push("/admin/dashboard/country/country");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/country/${countryId}`, {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            errorData || `Failed to fetch country: ${response.status}`
          );
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.message || "Failed to fetch country data");
        }
        const country = data.data;
        if (!country) {
          throw new Error(`Country with id "${countryId}" not found`);
        }
        setCountryName(country.name || "");
        setIsActive(country.isActive ?? true);
      } catch (error) {
        console.error("Error fetching country:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error
              ? error.message
              : "Failed to load country data",
        }));
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load country data",
          { description: "Redirecting to countries list." }
        );
        router.push("/admin/dashboard/country/country");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCountry();
  }, [admin, countryId, router]);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "countryName":
        if (!value?.trim()) {
          error = "Country name cannot be empty.";
        }
        break;
      default:
        break;
    }
    return error;
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "countryName") {
      setCountryName(value);
      const error = validateField("countryName", value);
      setFormErrors((prev) => ({ ...prev, countryName: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const errors = {
      countryName: validateField("countryName", countryName),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit countries.");
      router.push("/admin/dashboard/country/country");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: countryName.trim(),
      isActive,
    };
    try {
      const res = await fetch(`/api/country/${countryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });
      const rawBody = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(rawBody);
        } catch {
          errorData = rawBody || "No response body";
        }
        throw new Error(
          errorData.message || `Failed to update country: ${res.status}`
        );
      }
      toast.success("Country updated successfully!");

      router.push("/admin/dashboard/country/country");
    } catch (error) {
      console.error("Error updating country:", error);
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error ? error.message : "Something went wrong",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Country: {countryName || "Loading..."}
      </h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/2 bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                  <Skeleton className="h-8 w-1/4 bg-white/10" />
                  <div className="flex justify-end gap-4">
                    <Skeleton className="h-10 w-24 bg-white/10" />
                    <Skeleton className="h-10 w-24 bg-white/10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold text-white">Country Details</h3>
              <div className="space-y-2">
                <Label className="text-white/80">Country Name *</Label>
                <Input
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full md:w-5/8 ${
                    formErrors.countryName
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter country name"
                  name="countryName"
                  value={countryName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting || isLoading}
                />
                {formErrors.countryName && (
                  <p className="text-red-500 text-sm">
                    {formErrors.countryName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Set Status</Label>
                <div className="flex items-center">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <Label className="text-white/80">
                    {isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>

              {formErrors.general && (
                <p className="text-red-500 text-sm">{formErrors.general}</p>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Country"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCountryForm;
