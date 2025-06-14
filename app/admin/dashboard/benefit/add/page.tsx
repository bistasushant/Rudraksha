"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/admin/RichTextEditor";

// Function to generate slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

const AddBenefitForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [seoTitle, setSeoTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [metaKeywords, setMetaKeywords] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { admin } = useAuth();

  // State for form errors
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

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add benefits.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add benefits.");
      router.push("/admin/dashboard/benefit");
    }
  }, [admin, router]);

  // Validation function for blog category name
  const validateField = (title: string, value: string): string => {
    let error = "";
    switch (title) {
      case "title":
        if (!value.trim()) {
          error = "Title cannot be empty.";
        }
        break;
      case "description":
        if (!value.trim()) {
          error = "Description cannot be empty.";
        }
        break;
      case "seoTitle":
        if (typeof value === "string" && value.trim() && value.length > 60) {
          error = "SEO title must be 60 characters or less.";
        }
        break;
      case "metaDescription":
        if (typeof value === "string" && value.trim() && value.length > 160) {
          error = "Meta description must be 160 characters or less.";
        }
        break;
      case "metaKeywords":
        if (typeof value === "string" && value.trim()) {
          const keywords = value
            .split(",")
            .map((kw) => kw.trim())
            .filter(Boolean);
          if (keywords.length > 10) {
            error = "Meta keywords must not exceed 10 keywords.";
          }
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Handle input change with validation
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

    // Validate on change
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle blur with validation
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Validate entire form before submission
  const validateForm = (): boolean => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add benefit.");
      router.push("/admin/dashboard/benefit");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: title.trim(),
      slug: generateSlug(title.trim()),
      description: description,
      seoTitle: seoTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean)
        .join(",") || undefined,
    };

    try {
      if (!admin?.token) {
        throw new Error("Unauthorized: Please log in to add a benefit.");
      }

      const response = await fetch("/api/benefit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to add benefit: ${response.status}`);
      }

      toast.success("Benefit added successfully!", {
        description: `Benefit "${title}" has been created.`,
      });

      router.push("/admin/dashboard/benefit");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error("Error adding benefit", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRichTextChange = (html: string) => {
    setDescription(html);
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New Benefit</h1>

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
                      formErrors.title ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter title"
                    value={title}
                    onChange={(e) => handleInputChange(e, "title")}
                    onBlur={(e) => handleBlur(e, "title")}
                    disabled={isSubmitting}
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm">{formErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Description *</Label>
                  <RichTextEditor
                    placeholder="Enter package description..."
                    value={description}
                    onChange={handleRichTextChange}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm">
                      {formErrors.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">SEO Content</h3>
                <div className="space-y-2">
                  <Label className="text-white/80">SEO Title</Label>
                  <Input
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.seoTitle ? "border-red-500" : "border-white/20"
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
                {isSubmitting ? "Adding..." : "Add Benefit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBenefitForm;
