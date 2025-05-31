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
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import { validateName, validateSlug } from "@/lib/validation";

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

const AddCategoryForm = () => {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admin } = useAuth();

  const [formErrors, setFormErrors] = useState<{
    categoryName: string;
    seoTitle: string;
    metaDescription: string;
    metaKeywords: string;
    general: string;
  }>({
    categoryName: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/category");
    }
  }, [admin, router]);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "categoryName":
        if (!value?.trim()) {
          error = "Category name cannot be empty.";
        } else if (!validateName(value)) {
          error = "Category name is invalid.";
        } else if (!validateSlug(generateSlug(value))) {
          error = "Generated slug is invalid.";
        }
        break;
      case "seoTitle":
        if (value && value.length > 60) {
          error = "SEO title must be 60 characters or less.";
        }
        break;
      case "metaDescription":
        if (value && value.length > 160) {
          error = "Meta description must be 160 characters or less.";
        }
        break;
      case "metaKeywords":
        if (value && value.split(",").length > 10) {
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
      case "categoryName":
        setCategoryName(value);
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

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
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
      categoryName: validateField("categoryName", categoryName),
      seoTitle: validateField("seoTitle", seoTitle),
      metaDescription: validateField("metaDescription", metaDescription),
      metaKeywords: validateField("metaKeywords", metaKeywords),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add categories.");
      router.push("/admin/dashboard/category");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: categoryName.trim(),
      slug: generateSlug(categoryName.trim()),
      description: description || "",
      seoTitle: seoTitle.trim() || "",
      metaDescription: metaDescription.trim() || "",
      metaKeywords: metaKeywords.trim() || "",
      isActive,
    };

    try {
      const response = await fetch("/api/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to add category");
      }
      toast.success("Category added successfully!");
      router.push("/admin/dashboard/category");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add category.";
      console.error("Client error:", error);
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage, { description: "Please try again." });
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New Category</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-5xl mx-auto">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                <h3 className="text-lg font-bold text-white">
                  Category Details
                </h3>
                <div className="space-y-2">
                  <Label className="text-white/80">Category Name *</Label>
                  <Input
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.categoryName
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={(e) => handleInputChange(e, "categoryName")}
                    onBlur={(e) => handleBlur(e, "categoryName")}
                    disabled={isSubmitting}
                  />
                  {formErrors.categoryName && (
                    <p className="text-red-500 text-sm">
                      {formErrors.categoryName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">
                    Description (Optional)
                  </Label>
                  <RichTextEditor
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe the category..."
                  />
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
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCategoryForm;
