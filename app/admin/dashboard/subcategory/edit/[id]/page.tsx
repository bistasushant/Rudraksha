"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { validateName, validateSlug } from "@/lib/validation";
import { ICategory, ISubCategory } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

interface FormValues {
  subCategoryName: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  isActive: boolean;
  slug: string;
}

interface FormErrors {
  subCategoryName: string;
  categories: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  general: string;
}

const EditSubCategoryForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const params = useParams();
  const routeId = params.id as string;
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [subCategory, setSubCategory] = useState<ISubCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [formValues, setFormValues] = useState<FormValues>({
    subCategoryName: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    isActive: true,
    slug: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    subCategoryName: "",
    categories: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    general: "",
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check admin permissions
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit subcategories.");
      router.push("/admin/dashboard/subcategory");
    }
  }, [admin, router]);

  // Fetch subcategory and categories
  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch subcategory using slug
        const subCategoryResponse = await fetch(`/api/subcategory/${routeId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!subCategoryResponse.ok) {
          let errorMessage = `Failed to fetch subcategory: ${subCategoryResponse.status} ${subCategoryResponse.statusText}`;
          try {
            const errorData = await subCategoryResponse.json();
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            console.error(jsonError);
            try {
              const textError = await subCategoryResponse.text();
              console.error("Raw error response:", textError);
            } catch (textError) {
              console.error(textError);
              console.error("Could not extract error details");
            }
          }
          throw new Error(errorMessage);
        }

        const subCategoryResult = await subCategoryResponse.json();
        console.log(subCategoryResult)

        // Get subcategory data from the response
        const subCategoryData = subCategoryResult.data;

        if (!subCategoryData) {
          throw new Error("Subcategory not found in response data");
        }

        // Convert _id to id for consistency
        const formattedData = {
          ...subCategoryData,
          id: subCategoryData._id,
        };

        setSubCategory(formattedData);
        setOriginalSlug(formattedData.slug || "");

        // Update form values
        const newFormValues = {
          subCategoryName: formattedData.name || "",
          seoTitle: formattedData.seoTitle || "",
          metaDescription: formattedData.metaDescription || "",
          metaKeywords: formattedData.metaKeywords || "",
          isActive: formattedData.isActive ?? true,
          slug: formattedData.slug || "",
        };
        setFormValues(newFormValues);

        // Set categories
        const categoryIds = Array.isArray(formattedData.category)
          ? formattedData.category.map((cat: { _id?: string; id?: string } | string) => {
            if (typeof cat === 'object' && cat !== null) {
              return cat._id?.toString() || cat.id?.toString();
            }
            return cat.toString();
          })
          : formattedData.category
            ? [formattedData.category.toString()]
            : [];
        setSelectedCategories(categoryIds);

        // Fetch categories
        const categoriesResponse = await fetch("/api/category", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!categoriesResponse.ok) {
          const text = await categoriesResponse.text();
          console.error("Categories response text:", text);
          throw new Error(
            `Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`
          );
        }

        const categoriesResult = await categoriesResponse.json();
        console.log("Categories Response:", categoriesResult);
        const categoriesData = categoriesResult.data?.categories || [];
        if (!Array.isArray(categoriesData)) {
          throw new Error("Categories data is not an array");
        }
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load data.";
        setFormErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));
        toast.error(errorMessage, {
          description: "Please try refreshing the page or contact support.",
        });
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [admin, routeId, router]);

  const validateField = (
    name: keyof FormValues | "categories",
    value: string | string[] | boolean
  ): string => {
    let error = "";
    switch (name) {
      case "subCategoryName":
        if (typeof value !== "string" || !value.trim()) {
          error = "Subcategory name is required.";
        } else if (!validateName(value)) {
          error = "Subcategory name contains invalid characters.";
        }
        break;
      case "categories":
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
    const error = validateField(name as keyof FormValues, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof FormValues, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId];
      const error = validateField("categories", newCategories);
      setFormErrors((prev) => ({ ...prev, categories: error }));
      return newCategories;
    });
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      subCategoryName: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      isActive: true,
      slug: "",
    });
    setFormErrors({
      subCategoryName: "",
      categories: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      general: "",
    });
    setSelectedCategories([]);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      subCategoryName: validateField(
        "subCategoryName",
        formValues.subCategoryName
      ),
      categories: validateField("categories", selectedCategories),
      seoTitle: validateField("seoTitle", formValues.seoTitle),
      metaDescription: validateField(
        "metaDescription",
        formValues.metaDescription
      ),
      metaKeywords: validateField("metaKeywords", formValues.metaKeywords),
      general: "",
    };
    setFormErrors((prev) => ({ ...prev, ...errors }));
    const isValid = !Object.values(errors).some((error) => error);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    // Clear general error before submission
    setFormErrors((prev) => ({ ...prev, general: "" }));

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit subcategories.");
      router.push("/admin/dashboard/subcategory");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const slug = generateSlug(formValues.subCategoryName.trim());
    if (!validateSlug(slug)) {
      setFormErrors((prev) => ({
        ...prev,
        subCategoryName: "Generated slug is invalid.",
      }));
      toast.error("Generated slug is invalid.");
      setIsSubmitting(false);
      return;
    }

    const updateData: {
      name: string;
      category: string[];
      seoTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      isActive: boolean;
      slug?: string;
    } = {
      name: formValues.subCategoryName.trim(),
      category: selectedCategories,
      seoTitle: formValues.seoTitle.trim() || undefined,
      metaDescription: formValues.metaDescription.trim() || undefined,
      metaKeywords: formValues.metaKeywords.trim() || undefined,
      isActive: formValues.isActive,
    };

    if (formValues.slug && formValues.slug !== originalSlug) {
      updateData.slug = slug;
    }

    try {
      const updateEndpoint = originalSlug
        ? `/api/subcategory/${originalSlug}`
        : `/api/subcategory/${routeId}`;

      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Update response text:", text);
        let errorMessage = `Failed to update subcategory: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          console.error(jsonError);
          console.error("Update response is not JSON:", text);
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Update non-JSON response:", text);
        throw new Error("Update response is not JSON");
      }
      toast.success("Subcategory updated successfully!");
      resetForm(form);
      router.push("/admin/dashboard/subcategory");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update subcategory.";
      console.error("Client error:", error);
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage, {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(debouncedSearchTerm.toLowerCase().trim())
  );

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
          onClick={() => router.push("/admin/dashboard/subcategory")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Subcategory: {subCategory?.name || "Loading..."}
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
          <CardContent className="pt-6">
            {formErrors.general && (
              <div className="text-red-500 text-sm mb-4">
                <p>{formErrors.general}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Retry
                </Button>
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                  <h3 className="text-lg font-bold text-white">
                    Subcategory Details
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">Subcategory Name *</Label>
                    <Input
                      name="subCategoryName"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.subCategoryName
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter subcategory name"
                      value={formValues.subCategoryName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.subCategoryName && (
                      <p className="text-red-500 text-sm">
                        {formErrors.subCategoryName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2" ref={dropdownRef}>
                    <Label className="text-white/80">Categories *</Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${formErrors.categories
                          ? "border-red-500 border"
                          : "border-white/20"
                          }`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isSubmitting}
                        aria-expanded={isDropdownOpen}
                        aria-controls="category-dropdown"
                      >
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.length > 0 ? (
                            selectedCategories.map((categoryId) => {
                              const category = categories.find(
                                (cat) => cat.id === categoryId
                              );
                              return (
                                <span
                                  key={categoryId}
                                  className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                                >
                                  {category ? category.name : "Unknown"}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategoryToggle(categoryId);
                                    }}
                                    className="ml-1 text-white/80 hover:text-white cursor-pointer"
                                    aria-label={`Remove ${category?.name}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-white/50">
                              Select categories
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-white/50 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {isDropdownOpen && (
                        <div
                          id="category-dropdown"
                          className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          <div className="p-2">
                            <Input
                              placeholder="Search categories..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="bg-white/5 border-white/20 text-white w-full"
                              disabled={isSubmitting}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {loadingCategories ? (
                            <div className="px-4 py-2 text-white/70">
                              Loading categories...
                            </div>
                          ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-white/10 text-white hover:text-white flex items-center justify-between ${selectedCategories.includes(category.id)
                                  ? "bg-purple-600/70"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleCategoryToggle(category.id)
                                }
                                role="option"
                                aria-selected={selectedCategories.includes(
                                  category.id
                                )}
                              >
                                <span>{category.name}</span>
                                {selectedCategories.includes(category.id) && (
                                  <span className="text-green-400">✓</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-white/70">
                              No categories found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.categories && (
                      <p className="text-red-500 text-sm">
                        {formErrors.categories}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Set Status</Label>
                    <div className="flex items-center">
                      <Switch
                        checked={formValues.isActive}
                        onCheckedChange={(checked) =>
                          setFormValues((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                      <Label className="text-white/80">
                        {formValues.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">SEO Content</h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">SEO Title</Label>
                    <Input
                      name="seoTitle"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.seoTitle
                        ? "border-red-500"
                        : "border-white/20"
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
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${formErrors.metaDescription
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
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.metaKeywords
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

              {Object.values(formErrors).some(
                (error) => error && error !== formErrors.general
              ) && (
                  <div className="text-red-500 text-sm mb-4">
                    <p>Please fix the following errors:</p>
                    <ul>
                      {Object.entries(formErrors).map(([field, error]) =>
                        error && field !== "general" ? (
                          <li key={field}>
                            {field}: {error}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
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
                  {isSubmitting ? "Updating..." : "Update Subcategory"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditSubCategoryForm;
