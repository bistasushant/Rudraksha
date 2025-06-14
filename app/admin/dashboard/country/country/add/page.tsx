"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { validateName } from "@/lib/validation";
import { Skeleton } from "@/components/ui/skeleton";

interface FormErrors {
  countryName: string;
  general: string;
}

const AddCountryForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [countryName, setCountryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    countryName: "",
    general: "",
  });

  // Check authorization and simulate initial load
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/country");
    }
    // Simulate initial load delay (e.g., auth check)
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [admin, router]);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "countryName":
        if (!value.trim()) {
          error = "Country name cannot be empty.";
        } else if (!validateName(value)) {
          error = "Country name is invalid.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const { value } = e.target;
    if (field === "countryName") {
      setCountryName(value);
    }
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
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
      toast.error("You do not have permission to add countries.");
      router.push("/admin/dashboard/country");
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
      const res = await fetch("/api/country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add country.");
      }

      toast.success("Country added successfully!");
      router.push("/admin/dashboard/country/country");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(errorMessage);
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
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
          disabled={isSubmitting || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Add New Country</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-8 w-1/4 bg-white/10" />
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-24 bg-white/10" />
                <Skeleton className="h-10 w-24 bg-white/10" />
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold text-white">Country Details</h3>
              <div className="space-y-2">
                <Label className="text-white/80">Country Name *</Label>
                <Input
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.countryName
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter country name"
                  value={countryName}
                  onChange={(e) => handleInputChange(e, "countryName")}
                  onBlur={(e) => handleBlur(e, "countryName")}
                  disabled={isSubmitting}
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
                  {isSubmitting ? "Adding..." : "Add Country"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCountryForm;
