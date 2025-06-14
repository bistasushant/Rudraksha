"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";

const EditBenefitForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formErrors, setFormErrors] = useState<{
    title: string;
    description: string;
    seoTitle: string;
    metaDescription: string;
    metaKeywords: string;
    general: string;
  }>({
    title: "",
    description: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    general: "",
  });

  const params = useParams();
  const benefitSlug = params.slug as string;

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }

    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/benefit");
      return;
    }

    const fetchBenefits = async () => {
      if (!benefitSlug) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No benefit slug provided in URL.",
        }));
        router.push("/admin/dashboard/benefit");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/benefit/${benefitSlug}`, {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to fetch benefit: ${response.status}`
          );
        }

        const data = await response.json();

        const benefit = data.data;

        if (!benefit) {
          throw new Error(`Benefit with slug "${benefitSlug}" not found`);
        }

        // Set form fields with the category data
        setTitle(benefit.title || "");
        setDescription(benefit.description || "");
        setSeoTitle(benefit.seoTitle || "");
        setMetaDescription(benefit.metaDescription || "");
        setMetaKeywords(benefit.metaKeywords || "");

        // Clear any previous errors
        setFormErrors({
          title: "",
          description: "",
          seoTitle: "",
          metaDescription: "",
          metaKeywords: "",
          general: "",
        });
      } catch (error) {
        console.error("Error fetching benefit:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load benefit data";

        setFormErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));

        toast.error(errorMessage, {
          description: "Redirecting to benefit list.",
        });

        // Add a small delay before redirect to show the toast
        setTimeout(() => {
          router.push("/admin/dashboard/benefit");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBenefits();
  }, [admin, benefitSlug, router]);

  const validateField = (
    title: string,
    value: string | File | null
  ): string => {
    let error = "";
    switch (title) {
      case "title":
        if (!value?.toString().trim()) {
          error = "Title cannot be empty.";
        }
        break;
      case "description":
        if (!value?.toString().trim()) {
          error = "Description cannot be empty.";
        }
        break;
      case "seoTitle":
        if (value && (value as string).length > 60) {
          error = "SEO title must be 60 characters or less.";
        }
        break;
      case "metaDescription":
        if (value && (value as string).length > 160) {
          error = "Meta description must be 160 characters or less.";
        }
        break;
      case "metaKeywords":
        if (value && (value as string).split(",").length > 10) {
          error = "Meta keywords must not exceed 10 keywords.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    switch (field) {
      case "title":
        setTitle(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "seoTitle":
        setSeoTitle(value);
        break;
      case "metaDescription":
        setMetaDescription(value);
        break;
      case "metaKeywords":
        setMetaKeywords(value);
        break;
    }
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };


  const validateForm = () => {
    const errors = {
      title: validateField("title", title),
      description: validateField("description", description),
      seoTitle: validateField("seoTitle", seoTitle),
      metaDescription: validateField("metaDescription", metaDescription),
      metaKeywords: validateField("metaKeywords", metaKeywords),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit benefits.");
      router.push("/admin/dashboard/benefit");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const requestBody = {
      title: title.trim(),
      description: description || "",
      seoTitle: seoTitle.trim() || "",
      metaDescription: metaDescription.trim() || "",
      metaKeywords: metaKeywords.trim() || "",
    };

    try {
      const response = await fetch(`/api/benefit/${benefitSlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const rawBody = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(rawBody);
        } catch {
          errorData = rawBody || "No response body";
        }
        throw new Error(
          errorData.message || `Failed to update benefit: ${response.status}`
        );
      }
      toast.success("Benefit updated successfully!");
      router.push("/admin/dashboard/benefit?refresh=true");
    } catch (error) {
      console.error("Error updating benefit:", error);
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
          disabled={isSubmitting || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Benefit: {title || "Loading..."}
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                  <h3 className="text-lg font-bold text-white">
                    Benefit Details
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">Title *</Label>
                    <Input
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.title
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter title"
                      value={title}
                      onChange={(e) => handleInputChange(e, "title")}
                      onBlur={(e) => handleBlur(e, "title")}
                      disabled={isSubmitting}
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">
                      Description *
                    </Label>
                    <RichTextEditor
                      value={description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe the benefit..."
                    />
                  </div>

                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">SEO Content</h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">SEO Title</Label>
                    <Input
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.seoTitle
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter SEO title (max 60 characters)"
                      value={seoTitle}
                      onChange={(e) => handleInputChange(e, "seoTitle")}
                      onBlur={(e) => handleBlur(e, "seoTitle")}
                      disabled={isSubmitting}
                    />
                    <p className="text-white/50 text-sm">
                      {seoTitle.length}/60 characters
                    </p>
                    {formErrors.seoTitle && (
                      <p className="text-red-500 text-sm">
                        {formErrors.seoTitle}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Meta Description</Label>
                    <Textarea
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${
                        formErrors.metaDescription
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter meta description (max 160 characters)"
                      value={metaDescription}
                      onChange={(e) => handleInputChange(e, "metaDescription")}
                      onBlur={(e) => handleBlur(e, "metaDescription")}
                      disabled={isSubmitting}
                    />
                    <p className="text-white/50 text-sm">
                      {metaDescription.length}/160 characters
                    </p>
                    {formErrors.metaDescription && (
                      <p className="text-red-500 text-sm">
                        {formErrors.metaDescription}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Meta Keywords</Label>
                    <Input
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.metaKeywords
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter meta keywords (comma-separated, max 10)"
                      value={metaKeywords}
                      onChange={(e) => handleInputChange(e, "metaKeywords")}
                      onBlur={(e) => handleBlur(e, "metaKeywords")}
                      disabled={isSubmitting}
                    />
                    {formErrors.metaKeywords && (
                      <p className="text-red-500 text-sm">
                        {formErrors.metaKeywords}
                      </p>
                    )}
                  </div>
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
                  {isSubmitting ? "Updating..." : "Update Benefit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditBenefitForm;
