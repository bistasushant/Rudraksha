"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { IBlogcategory } from "@/types";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useDebounce } from "@/hooks/useDebounce";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

interface FormValues {
  blogName: string;
  blogHeading: string;
  blogDescription: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string; // Changed from string | null to string
}

interface FormErrors {
  blogName: string;
  blogHeading: string;
  blogDescription: string;
  selectedCategories: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string;
  general: string;
}

const AddBlogForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<IBlogcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    blogName: "",
    blogHeading: "",
    blogDescription: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "", // Changed from null to ""
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    blogName: "",
    blogHeading: "",
    blogDescription: "",
    selectedCategories: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add blogs.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blogs.");
      router.push("/admin/dashboard/blog");
    }
  }, [admin, router]);

  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;
    const fetchBlogCategories = async () => {
      try {
        const response = await fetch("/api/blogcategory", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to fetch blog categories: ${response.status}`
          );
        }

        const result = await response.json();
        const categoriesData = result.data?.blogCategories || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching blog categories:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load blog categories.",
          { description: "Please try again later." }
        );
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchBlogCategories();
  }, [admin, router]);

  const validateField = (
    name: string,
    value: string | string[] | null
  ): string => {
    let error = "";
    switch (name) {
      case "blogName":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog name cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Blog name must be at least 3 characters long.";
        }
        break;
      case "blogHeading":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog heading cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Blog heading must be at least 3 characters long.";
        }
        break;
      case "blogDescription":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog description cannot be empty.";
        } else if (value.trim().length < 10) {
          error = "Blog description must be at least 10 characters long.";
        }
        break;
      case "selectedCategories":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least one category must be selected.";
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
      case "image":
        if (typeof value !== "string" || value === "") {
          // Changed to check for empty string
          error = "Blog image is required.";
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

  const handleRichTextChange = (html: string) => {
    setFormValues((prev) => ({ ...prev, blogDescription: html }));
    const error = validateField("blogDescription", html);
    setFormErrors((prev) => ({ ...prev, blogDescription: error }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId];
      const error = validateField("selectedCategories", newCategories);
      setFormErrors((prev) => ({ ...prev, selectedCategories: error }));
      return newCategories;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        setFormErrors((prev) => ({
          ...prev,
          image: "File size exceeds 2MB limit.",
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setFormValues((prev) => ({ ...prev, image: imageData }));
        const error = validateField("image", imageData);
        setFormErrors((prev) => ({ ...prev, image: error }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormValues((prev) => ({ ...prev, image: "" })); // Changed to set empty string
    const error = validateField("image", "");
    setFormErrors((prev) => ({ ...prev, image: error }));
  };

  const validateForm = (): boolean => {
    const errors = {
      blogName: validateField("blogName", formValues.blogName),
      blogHeading: validateField("blogHeading", formValues.blogHeading),
      blogDescription: validateField(
        "blogDescription",
        formValues.blogDescription
      ),
      selectedCategories: validateField(
        "selectedCategories",
        selectedCategories
      ),
      seoTitle: validateField("seoTitle", formValues.seoTitle),
      metaDescription: validateField(
        "metaDescription",
        formValues.metaDescription
      ),
      metaKeywords: validateField("metaKeywords", formValues.metaKeywords),
      image: validateField("image", formValues.image), // Updated to validate string
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      blogName: "",
      blogHeading: "",
      blogDescription: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: "", // Changed to empty string
    });
    setSelectedCategories([]);
    setIsDropdownOpen(false);
    setSearchTerm("");
    setFormErrors({
      blogName: "",
      blogHeading: "",
      blogDescription: "",
      selectedCategories: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: "",
      general: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blogs.");
      router.push("/admin/dashboard/blog");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      name: formValues.blogName.trim(),
      slug: generateSlug(formValues.blogName.trim()),
      heading: formValues.blogHeading.trim(),
      category: selectedCategories,
      description: formValues.blogDescription.trim(),
      seoTitle: formValues.seoTitle.trim(),
      metaDescription: formValues.metaDescription.trim(),
      metaKeywords: formValues.metaKeywords.trim(),
      image: formValues.image,
    };

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add blog.");
      }

      toast.success("Blog added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/blog");
    } catch (error) {
      console.error("Add Blog Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while adding the blog.";
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

  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(debouncedSearchTerm.toLowerCase().trim())
  );

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
      <h1 className="text-2xl font-bold text-white mb-4">Add New Blog</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                <h3 className="text-lg font-bold text-white">Blog Details</h3>
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Image *</Label>
                  <div className="relative group w-full max-w-md mx-auto">
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${
                        formErrors.image ? "border-red-500" : "border-white/30"
                      }`}
                    >
                      {formValues.image ? ( // Changed from formValues.image !== null
                        <div className="relative w-full h-full p-2">
                          <Image
                            src={formValues.image}
                            alt="Blog image preview"
                            fill
                            className="object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-white/50 mb-2 group-hover:text-purple-400" />
                          <span className="text-white/70 group-hover:text-purple-400">
                            Click to upload an image
                          </span>
                          <span className="text-sm text-white/50">
                            PNG, JPG (max. 2MB)
                          </span>
                        </>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                    />
                    {formErrors.image && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.image}
                      </p>
                    )}
                     <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                      <p className="text-sm text-white/60 font-medium">Recommended size: 1907 x 943 pixels</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/80">Blog Name *</Label>
                    <Input
                      name="blogName"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.blogName
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter blog name"
                      required
                      value={formValues.blogName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.blogName && (
                      <p className="text-red-500 text-sm">
                        {formErrors.blogName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Blog Heading *</Label>
                    <Input
                      name="blogHeading"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.blogHeading
                          ? "border-red-500"
                          : "border-white/20"
                      }`}
                      placeholder="Enter Blog Heading"
                      required
                      value={formValues.blogHeading}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.blogHeading && (
                      <p className="text-red-500 text-sm">
                        {formErrors.blogHeading}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Blog Categories *</Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white ${
                          formErrors.selectedCategories
                            ? "border-red-500"
                            : "border-white/20"
                        } focus:ring-2 focus:ring-gray-500`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.length > 0 ? (
                            selectedCategories.map((categoryId) => (
                              <span
                                key={categoryId}
                                className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                              >
                                {
                                  categories.find(
                                    (cat) => cat.id === categoryId
                                  )?.name
                                }
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryToggle(categoryId);
                                  }}
                                  className="ml-1 text-white/80 hover:text-white cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-white/50">
                              Select blog categories
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-white/50 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {formErrors.selectedCategories && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.selectedCategories}
                        </p>
                      )}
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <Input
                              placeholder="Search blog categories..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="bg-white/5 border-white/20 text-white w-full"
                              disabled={isSubmitting}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {loadingCategories ? (
                            <div className="px-4 py-2 text-white/70">
                              Loading blog categories...
                            </div>
                          ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                                  category.id &&
                                  selectedCategories.includes(category.id)
                                    ? "bg-purple-600/70"
                                    : ""
                                }`}
                                onClick={() =>
                                  category.id &&
                                  handleCategoryToggle(category.id)
                                }
                              >
                                <span>{category.name}</span>
                                {category.id &&
                                  selectedCategories.includes(category.id) && (
                                    <span className="text-green-400">✓</span>
                                  )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-white/70">
                              No blog categories found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Description *</Label>
                    <RichTextEditor
                      placeholder="Describe the blog..."
                      value={formValues.blogDescription}
                      onChange={handleRichTextChange}
                    />
                    {formErrors.blogDescription && (
                      <p className="text-red-500 text-sm">
                        {formErrors.blogDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">SEO Content</h3>
                <div className="space-y-2">
                  <Label className="text-white/80">SEO Title</Label>
                  <Input
                    name="seoTitle"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.seoTitle ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter SEO title (max 60 characters)"
                    value={formValues.seoTitle}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  <p className="text-white/50 text-sm">
                    {formValues.seoTitle.length}/60 characters
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
                    name="metaDescription"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${
                      formErrors.metaDescription
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Enter meta description (max 160 characters)"
                    value={formValues.metaDescription}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  <p className="text-white/50 text-sm">
                    {formValues.metaDescription.length}/160 characters
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
                    name="metaKeywords"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.metaKeywords
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Enter meta keywords (comma-separated, max 10)"
                    value={formValues.metaKeywords}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
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
                {isSubmitting ? "Adding..." : "Add Blog"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBlogForm;
