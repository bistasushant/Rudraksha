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
import { Textarea } from "@/components/ui/textarea";

const EditBlogCategoryForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [blogCategoryName, setBlogCategoryName] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    blogCategoryName: string;
    seoTitle: string;
    metaDescription: string;
    metaKeywords: string;
    general: string;
  }>({
    blogCategoryName: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    general: "",
  });

  const params = useParams();
  const blogCategorySlug = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to edit blog categories.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blog categories.");
      router.push("/admin/dashboard/blogcategory");
      return;
    }
    const fetchCategory = async () => {
      if (!blogCategorySlug) {
        toast.error("No blog category slug provided in URL.");
        router.push("/admin/dashboard/blogcategory");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/blogcategory/${blogCategorySlug}`, {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            errorData || `Failed to fetch blog category: ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.data) {
          throw new Error(
            `Blog category with slug "${blogCategorySlug}" not found`
          );
        }

        const blogCategory = data.data;

        setBlogCategoryName(blogCategory.name || "");
        setSeoTitle(blogCategory.seoTitle || "");
        setMetaDescription(blogCategory.metaDescription || "");
        setMetaKeywords(blogCategory.metaKeywords || "");
      } catch (error) {
        console.error("Error fetching blog category:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error
              ? error.message
              : "Failed to load blog category data",
        }));
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load blog category data",
          {
            description: "Please try again or check the console for details.",
          }
        );
        router.push("/admin/dashboard/blogcategory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [admin, blogCategorySlug, router]);

  // Validation function
  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "blogCategoryName":
        if (!value?.trim()) {
          error = "Blog category name cannot be empty.";
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

  // Handle input change with validation
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const { value } = e.target;
    switch (field) {
      case "blogCategoryName":
        setBlogCategoryName(value);
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
    const error = validateField("blogCategoryName", value);
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
  const validateForm = () => {
    const errors = {
      blogCategoryName: validateField("blogCategoryName", blogCategoryName),
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
      toast.error("You do not have permission to edit blog categories.");
      router.push("/admin/dashboard/blogcategory");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: blogCategoryName.trim(),
      seoTitle: seoTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
    };

    try {
      const response = await fetch(`/api/blogcategory/${blogCategorySlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
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
          errorData.message ||
          `Failed to update blog category: ${response.status}`
        );
      }

      toast.success("Blog category updated successfully!", {
        description: "The blog category has been updated.",
      });
      router.push("/admin/dashboard/blogcategory");
    } catch (error) {
      console.error("Error updating blog category:", error);
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      }));
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
        {
          description: "Check the console for more details.",
        }
      );
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
      <h1 className="text-2xl font-bold text-white mb-4">Edit Blog Category: {blogCategoryName || "Loading..."}</h1>
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
                    Blog Category Details
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">
                      Blog Category Name *
                    </Label>
                    <Input
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.blogCategoryName
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter blog category name"
                      required
                      value={blogCategoryName}
                      onChange={(e) => handleInputChange(e, "blogCategoryName")}
                      onBlur={(e) => handleBlur(e, "blogCategoryName")}
                      disabled={isSubmitting}
                    />
                    {formErrors.blogCategoryName && (
                      <p className="text-red-500 text-sm">
                        {formErrors.blogCategoryName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">SEO Content</h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">SEO Title</Label>
                    <Input
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.seoTitle
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
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${formErrors.metaDescription
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
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.metaKeywords
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
                  {isSubmitting ? "Updating..." : "Update Blog Category"}
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditBlogCategoryForm;
