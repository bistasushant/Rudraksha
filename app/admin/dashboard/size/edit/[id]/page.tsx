"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface FormValues {
  size: string;
}

interface FormErrors {
  size: string;
  general: string;
}

const EditSizeForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formValues, setFormValues] = useState<FormValues>({
    size: "",
  });

  const [isActive, setIsActive] = useState(true);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    size: "",
    general: "",
  });

  const params = useParams();
  const sizeId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }

    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/size");
      return;
    }

    const fetchSize = async () => {
      if (!sizeId) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No size id provided in URL.",
        }));
        router.push("/admin/dashboard/size");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/size/${sizeId}`, {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to fetch size: ${response.status}`
          );
        }

        const data = await response.json();
        const size = data.data;

        if (!size) {
          throw new Error(`Size with Id "${sizeId}" not found`);
        }

        setFormValues({
          size: size.size || "",
        });
        setIsActive(size.isActive ?? true);

        setFormErrors({
          size: "",
          general: "",
        });
      } catch (error) {
        console.error("Error fetching size:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load size data";

        setFormErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));

        toast.error(errorMessage, {
          description: "Redirecting to size list.",
        });

        setTimeout(() => {
          router.push("/admin/dashboard/size");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSize();
  }, [admin, sizeId, router]);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "size":
        if (!value.trim()) {
          error = "Size cannot be empty.";
        }
        break;
      case "price":
        if (!value) {
          error = "Price cannot be empty.";
        } else {
          const priceValue = parseFloat(value);
          if (isNaN(priceValue) || priceValue <= 0) {
            error = "Price must be a valid positive number.";
          }
        }
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      size: validateField("size", formValues.size),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit sizes.");
      router.push("/admin/dashboard/size");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      size: formValues.size.trim(),
      isActive,
    };

    try {
      const response = await fetch(`/api/size/${sizeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update size: ${response.status}`);
      }

      toast.success("Size updated successfully!");
      router.push("/admin/dashboard/size");
    } catch (error) {
      console.error("Error updating size:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage);
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
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Size: {formValues.size || "Loading..."}
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Size Details</h3>

                <div className="space-y-2">
                  <Label className="text-white/80">Name *</Label>
                  <Input
                    name="size"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.size ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter Size"
                    value={formValues.size}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  {formErrors.size && (
                    <p className="text-red-500 text-sm">{formErrors.size}</p>
                  )}
                </div>

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
                  {isSubmitting ? "Updating..." : "Update Size"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditSizeForm;
