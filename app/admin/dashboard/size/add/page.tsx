"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const AddSizeForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formValues, setFormValues] = useState<FormValues>({
    size: "",
  });

  const [isActive, setIsActive] = useState(true);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    size: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/size");
    }
  }, [admin, router]);

  const validateField = (size: string, value: string | string[]): string => {
    let error = "";
    switch (size) {
      case "size":
        if (typeof value === "string" && !value) {
          error = "Size cannot be empty.";
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

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      size: "",
    });
    setFormErrors({
      size: "",
      general: "",
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      size: validateField("size", formValues.size),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add sizes.");
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
      const response = await fetch("/api/size", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add size.");
      }

      toast.success("Size added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/size");
    } catch (error) {
      console.error("Add Size Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while adding the size.";
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
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Add New Size</h1>

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
                {isSubmitting ? "Adding..." : "Add Design"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSizeForm;
