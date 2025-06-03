"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { ICategory } from "@/types";
import Image from "next/image";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

// Interface for subcategory with parent category
interface ICategoryWithParent extends ICategory {
  parentId?: string;
  category_id?: string | { id: string; name: string };
  category: { id: string; name: string }[] | string[] | { id: string; name: string } | string;
}

const EditProductForm = () => {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const { admin } = useAuth();

  // State for form data
  const [formValues, setFormValues] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    benefit: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    slug: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    categories: "",
    subcategories: "",
    price: "",
    stock: "",
    description: "",
    benefit: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    images: "",
    general: "",
  });

  // State for selections and UI
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] =
    useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [subcategories, setSubcategories] = useState<ICategoryWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NPR" | "">("NPR");

  // Conversion rate (1 USD = 135 NPR, replace with API if needed)
  const CONVERSION_RATE_USD_TO_NPR = 135;

  const debouncedCategorySearchTerm = useDebounce(categorySearchTerm, 300);
  const debouncedSubcategorySearchTerm = useDebounce(
    subcategorySearchTerm,
    300
  );

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch currency
  useEffect(() => {
    if (!admin?.token) return;

    const fetchCurrency = async () => {
      try {
        const response = await fetch("/api/sitesetting/setting/currency", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.error && result.data?.currency?.currency) {
          setCurrency(result.data.currency.currency);
        } else {
          setCurrency("NPR"); // Default to NPR
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
        setCurrency("NPR"); // Fallback to NPR
      }
    };

    fetchCurrency();
  }, [admin]);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        subcategoryDropdownRef.current &&
        !subcategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubcategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Redirect if not authenticated or authorized
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/products");
    }
  }, [admin, router]);

  // Fetch product, categories, and subcategories
  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fixed: Use the correct API endpoint structure
        const productResponse = await fetch(`/api/products/${routeId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(errorData.message || "Failed to fetch product");
        }

        const productResult = await productResponse.json();

        // Fixed: Handle the array response from your API
        const productData = Array.isArray(productResult.data)
          ? productResult.data[0] // Get first product from array
          : productResult.data;

        if (!productData) {
          throw new Error("Product not found");
        }

        // Convert price to display currency (USD or NPR)
        const priceInDisplayCurrency =
          currency === "USD"
            ? (productData.price / CONVERSION_RATE_USD_TO_NPR).toFixed(2)
            : productData.price.toString();

        setFormValues({
          name: productData.name || "",
          price: priceInDisplayCurrency,
          stock: String(productData.stock || 0),
          description: productData.description || "",
          benefit: productData.benefit || "",
          seoTitle: productData.seoTitle || "",
          metaDescription: productData.metaDescription || "",
          metaKeywords: productData.metaKeywords || "",
          slug: productData.slug || "",
        });
        setOriginalSlug(productData.slug || "");
        setSelectedImages(productData.images || []);
        setSelectedCategories(
          Array.isArray(productData.category)
            ? productData.category.map((cat: ICategory | string) =>
              typeof cat === "string"
                ? cat
                : cat.id?.toString() || cat.id?.toString()
            )
            : productData.category
              ? [productData.category.toString()]
              : []
        );
        setSelectedSubcategories(
          Array.isArray(productData.subcategory)
            ? productData.subcategory.map((sub: ICategory | string) =>
              typeof sub === "string"
                ? sub
                : sub.id?.toString() || sub.id?.toString()
            )
            : productData.subcategory
              ? [productData.subcategory.toString()]
              : []
        );

        // Fetch categories
        const categoriesResponse = await fetch("/api/category", {
          headers: { Authorization: `Bearer ${admin.token}` },
          cache: "no-store",
        });
        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json();
          throw new Error(errorData.message || "Failed to fetch categories");
        }
        const categoriesResult = await categoriesResponse.json();
        setCategories(categoriesResult.data?.categories || []);

        // Fetch subcategories
        const subcategoriesResponse = await fetch("/api/subcategory", {
          headers: { Authorization: `Bearer ${admin.token}` },
          cache: "no-store",
        });
        if (!subcategoriesResponse.ok) {
          const errorData = await subcategoriesResponse.json();
          throw new Error(errorData.message || "Failed to fetch subcategories");
        }
        const subcategoriesResult = await subcategoriesResponse.json();
        const fetchedSubcategories = subcategoriesResult.data?.categories || [];

        const transformedSubcategories = fetchedSubcategories.map(
          (sub: Omit<ICategoryWithParent, "category_id"> & {
            category_id?:
            | string
            | { id: string; name: string }
            | { _id: string; name: string };
          }) => {
            // Handle different category formats
            let parentId: string | undefined;
            let categoryArray: Array<{ id: string; name: string } | string> = [];

            if (Array.isArray(sub.category)) {
              categoryArray = sub.category;
              if (sub.category.length > 0) {
                const firstCat = sub.category[0];
                if (typeof firstCat === "object" && firstCat !== null) {
                  parentId = (firstCat.id || firstCat.id || "").toString();
                } else if (firstCat) {
                  parentId = firstCat.toString();
                }
              }
            } else if (sub.category) {
              // Handle single category object or string
              if (typeof sub.category === "object" && sub.category !== null) {
                categoryArray = [sub.category];
                parentId = (sub.category.id || sub.category.id || "").toString();
              } else {
                categoryArray = [sub.category.toString()];
                parentId = sub.category.toString();
              }
            }

            // Handle category_id if present
            if (!parentId && sub.category_id) {
              if (typeof sub.category_id === "object" && sub.category_id !== null) {
                parentId = (sub.category_id || sub.category_id || "").toString();
              } else {
                parentId = sub.category_id.toString();
              }
            }

            return {
              ...sub,
              id: sub.id?.toString() || "",
              name: sub.name || "Unnamed Subcategory",
              parentId,
              category: categoryArray,
              category_id: sub.category_id,
            };
          }
        ) as ICategoryWithParent[];

        setSubcategories(transformedSubcategories);
      } catch (error) {
        console.error("Fetch Data Error:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error ? error.message : "Failed to load data.",
        }));
        toast.error("Failed to load product data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin, routeId, router, currency]);

  // Reset subcategories when categories change
  useEffect(() => {
    if (loading) return;
    if (selectedCategories.length === 0) {
      setSelectedSubcategories([]);
      setSubcategorySearchTerm("");
    } else {
      setSelectedSubcategories((prev) =>
        prev.filter((subId) => {
          const subcategory = subcategories.find((sub) => sub.id === subId);
          if (!subcategory) return false;

          // Check if any of the subcategory's categories are in the selected categories
          const hasMatchingCategory = Array.isArray(subcategory.category)
            ? subcategory.category.some(cat => {
              if (!cat) return false;
              let categoryId: string;

              if (typeof cat === 'object' && cat !== null) {
                if ('id' in cat && cat.id) {
                  categoryId = cat.id.toString();
                } else if ('_id' in cat && cat._id) {
                  categoryId = cat._id.toString();
                } else {
                  return false;
                }
              } else if (cat) {
                categoryId = cat.toString();
              } else {
                return false;
              }

              return selectedCategories.includes(categoryId);
            })
            : false;

          // Also check parentId and category_id for backward compatibility
          const hasMatchingParent = selectedCategories.some(catId =>
            catId === subcategory.parentId ||
            (typeof subcategory.category_id === 'string' && catId === subcategory.category_id)
          );

          return hasMatchingCategory || hasMatchingParent;
        })
      );
    }
  }, [selectedCategories, subcategories, loading]);

  // Form validation
  const validateField = (name: string, value: string | string[]) => {
    let error = "";
    switch (name) {
      case "name":
        if (typeof value === "string" && !value.trim())
          error = "Product name is required.";
        break;
      case "categories":
        if (Array.isArray(value) && value.length === 0)
          error = "At least one category is required.";
        break;
      case "subcategories":
        if (
          Array.isArray(value) &&
          value.length === 0 &&
          selectedCategories.length > 0
        )
          error =
            "At least one subcategory is required when categories are selected.";
        break;
      case "price":
        if (typeof value === "string") {
          const priceValue = parseFloat(value);
          if (!value) error = "Price is required.";
          else if (isNaN(priceValue) || priceValue <= 0)
            error = "Price must be a positive number.";
        }
        break;
      case "stock":
        if (typeof value === "string") {
          const stockValue = parseInt(value, 10);
          if (!value) error = "Stock quantity is required.";
          else if (isNaN(stockValue) || stockValue < 0)
            error = "Stock must be a non-negative number.";
        }
        break;
      case "description":
        if (typeof value === "string" && !value.trim())
          error = "Description is required.";
        break;
      case "benefit":
        if (typeof value === "string" && !value.trim())
          error = "Benefit is required.";
        break;
      case "seoTitle":
        if (typeof value === "string" && value.trim() && value.length > 60)
          error = "SEO title must be 60 characters or less.";
        break;
      case "metaDescription":
        if (typeof value === "string" && value.trim() && value.length > 160)
          error = "Meta description must be 160 characters or less.";
        break;
      case "metaKeywords":
        if (typeof value === "string" && value.trim()) {
          const keywords = value
            .split(",")
            .map((kw) => kw.trim())
            .filter(Boolean);
          if (keywords.length > 10)
            error = "Meta keywords must not exceed 10 keywords.";
        }
        break;
      case "images":
        if (Array.isArray(value) && value.length === 0)
          error = "At least one image is required.";
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = () => {
    const errors = {
      name: validateField("name", formValues.name),
      categories: validateField("categories", selectedCategories),
      subcategories: validateField("subcategories", selectedSubcategories),
      price: validateField("price", formValues.price),
      stock: validateField("stock", formValues.stock),
      description: validateField("description", formValues.description),
      benefit: validateField("benefit", formValues.benefit),
      seoTitle: validateField("seoTitle", formValues.seoTitle),
      metaDescription: validateField(
        "metaDescription",
        formValues.metaDescription
      ),
      metaKeywords: validateField("metaKeywords", formValues.metaKeywords),
      images: validateField("images", selectedImages),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleRichTextChange = (name: string, html: string) => {
    setFormValues((prev) => ({ ...prev, [name]: html }));
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, html) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          images: `File ${file.name} exceeds 2MB limit.`,
        }));
        return null;
      }
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImages)
      .then((images) => {
        const filteredImages = images.filter(
          (img): img is string => img !== null
        );
        setSelectedImages((prev) => {
          const updatedImages = [...prev, ...filteredImages];
          setFormErrors((prev) => ({
            ...prev,
            images: validateField("images", updatedImages),
          }));
          return updatedImages;
        });
      })
      .catch(() => {
        setFormErrors((prev) => ({
          ...prev,
          images: "Error processing images.",
        }));
        toast.error("Error processing images.");
      });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setFormErrors((prev) => ({
        ...prev,
        images: validateField("images", updated),
      }));
      return updated;
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId];
      setFormErrors((prev) => ({
        ...prev,
        categories: validateField("categories", newCategories),
      }));
      return newCategories;
    });
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    setSelectedSubcategories((prev) => {
      const newSubcategories = prev.includes(subcategoryId)
        ? prev.filter((sub) => sub !== subcategoryId)
        : [...prev, subcategoryId];
      setFormErrors((prev) => ({
        ...prev,
        subcategories: validateField("subcategories", newSubcategories),
      }));
      return newSubcategories;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit products.");
      router.push("/admin/dashboard/products");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert price to NPR if entered in USD
      const priceValue = parseFloat(formValues.price);
      const priceInNPR =
        currency === "USD"
          ? priceValue * CONVERSION_RATE_USD_TO_NPR
          : priceValue;

      const updateData = {
        name: formValues.name.trim(),
        category: selectedCategories,
        subcategory: selectedSubcategories,
        price: priceInNPR,
        stock: parseInt(formValues.stock, 10),
        description: formValues.description.trim(),
        benefit: formValues.benefit.trim(),
        seoTitle: formValues.seoTitle.trim(),
        metaDescription: formValues.metaDescription.trim(),
        metaKeywords: formValues.metaKeywords.trim(),
        images: selectedImages,
        ...(formValues.slug &&
          formValues.slug !== originalSlug && { slug: formValues.slug }),
      };

      const updateEndpoint = originalSlug
        ? `/api/products/${originalSlug}`
        : `/api/products/${routeId}`;
      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/admin/dashboard/products");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update product";
      setFormErrors((prev) => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories and subcategories for dropdowns
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(debouncedCategorySearchTerm.toLowerCase().trim())
  );

  const filteredSubcategories = useMemo(() => {
    if (!selectedCategories.length) {
      return [];
    }

    return subcategories.filter((subcategory: ICategoryWithParent) => {
      // Check if any of the subcategory's categories are in the selected categories
      const hasMatchingCategory = Array.isArray(subcategory.category)
        ? subcategory.category.some(cat => {
          if (!cat) return false;
          let categoryId: string;

          if (typeof cat === 'object' && cat !== null) {
            if ('id' in cat && cat.id) {
              categoryId = cat.id.toString();
            } else if ('_id' in cat && cat._id) {
              categoryId = cat._id.toString();
            } else {
              return false;
            }
          } else if (cat) {
            categoryId = cat.toString();
          } else {
            return false;
          }

          return selectedCategories.includes(categoryId);
        })
        : false;

      // Also check parentId and category_id for backward compatibility
      const hasMatchingParent = selectedCategories.some(catId =>
        catId === subcategory.parentId ||
        (typeof subcategory.category_id === 'string' && catId === subcategory.category_id) ||
        (typeof subcategory.category_id === 'object' &&
          subcategory.category_id !== null &&
          'id' in subcategory.category_id &&
          catId === subcategory.category_id.id.toString())
      );

      const matchesSearch = subcategory.name
        .toLowerCase()
        .includes(debouncedSubcategorySearchTerm.toLowerCase().trim());

      return (hasMatchingCategory || hasMatchingParent) && matchesSearch;
    });
  }, [subcategories, selectedCategories, debouncedSubcategorySearchTerm]);

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
          onClick={() => router.push("/admin/dashboard/products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Product: {formValues.name || "Loading..."}
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-5xl mx-auto">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                  <h3 className="text-lg font-bold text-white">
                    Product Details
                  </h3>

                  {/* Product Images */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Product Images *</Label>
                    <div className="relative group w-full max-w-md mx-auto">
                      <label
                        htmlFor="image-upload"
                        className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${formErrors.images
                          ? "border-red-500"
                          : "border-white/30"
                          }`}
                      >
                        {selectedImages.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 w-full h-full p-2 overflow-auto">
                            {selectedImages.map((image, index) => (
                              <div
                                key={index}
                                className="relative aspect-square"
                              >
                                <Image
                                  src={image}
                                  alt={`Preview ${index + 1}`}
                                  width={100}
                                  height={100}
                                  className="object-cover w-full h-full rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-white/50 mb-2 group-hover:text-purple-400" />
                            <span className="text-white/70 group-hover:text-purple-400">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-sm text-white/50">
                              PNG, JPG (max. 2MB each)
                            </span>
                          </>
                        )}
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                        multiple
                        disabled={isSubmitting}
                      />
                      {formErrors.images && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.images}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Product Name *</Label>
                    <Input
                      name="name"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.name ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter product name"
                      value={formValues.name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Categories Dropdown */}
                  <div className="space-y-2" ref={categoryDropdownRef}>
                    <Label className="text-white/80">Categories *</Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${formErrors.categories
                          ? "border-red-500 border"
                          : "border-white/20"
                          }`}
                        onClick={() =>
                          setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                        }
                        disabled={isSubmitting}
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
                          className={`h-5 w-5 text-white/50 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {isCategoryDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <Input
                              placeholder="Search categories..."
                              value={categorySearchTerm}
                              onChange={(e) =>
                                setCategorySearchTerm(e.target.value)
                              }
                              className="bg-white/5 border-white/20 text-white w-full"
                              disabled={isSubmitting}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${selectedCategories.includes(category.id)
                                  ? "bg-purple-600/70"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleCategoryToggle(category.id)
                                }
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

                  {/* Subcategories Dropdown */}
                  <div className="space-y-2" ref={subcategoryDropdownRef}>
                    <Label className="text-white/80">Subcategories *</Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${formErrors.subcategories
                          ? "border-red-500 border"
                          : "border-white/20"
                          }`}
                        onClick={() =>
                          setIsSubcategoryDropdownOpen(
                            !isSubcategoryDropdownOpen
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-wrap gap-2">
                          {selectedSubcategories.length > 0 ? (
                            selectedSubcategories.map((subcategoryId) => {
                              const subcategory = subcategories.find(
                                (sub) => sub.id === subcategoryId
                              );
                              return (
                                <span
                                  key={subcategoryId}
                                  className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                                >
                                  {subcategory ? subcategory.name : "Unknown"}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubcategoryToggle(subcategoryId);
                                    }}
                                    className="ml-1 text-white/80 hover:text-white cursor-pointer"
                                  >
                                    <X className="h-4 w-4" />
                                  </span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-white/50">
                              Select subcategories
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-white/50 transition-transform ${isSubcategoryDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {isSubcategoryDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <Input
                              placeholder="Search subcategories..."
                              value={subcategorySearchTerm}
                              onChange={(e) =>
                                setSubcategorySearchTerm(e.target.value)
                              }
                              className="bg-white/5 border-white/20 text-white w-full"
                              disabled={isSubmitting}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredSubcategories.length > 0 ? (
                            filteredSubcategories.map((subcategory) => (
                              <div
                                key={subcategory.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${selectedSubcategories.includes(subcategory.id)
                                  ? "bg-purple-600/70"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleSubcategoryToggle(subcategory.id)
                                }
                              >
                                <span>{subcategory.name}</span>
                                {selectedSubcategories.includes(
                                  subcategory.id
                                ) && <span className="text-green-400">✓</span>}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-white/70">
                              No subcategories available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.subcategories && (
                      <p className="text-red-500 text-sm">
                        {formErrors.subcategories}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label className="text-white/80">
                      Price ({currency === "USD" ? "$" : "Rs"}) *
                    </Label>
                    <Input
                      name="price"
                      type="number"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.price ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="0.00"
                      value={formValues.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm">{formErrors.price}</p>
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Stock Quantity *</Label>
                    <Input
                      name="stock"
                      type="number"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.stock ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter quantity"
                      value={formValues.stock}
                      onChange={handleInputChange}
                      min="0"
                      disabled={isSubmitting}
                    />
                    {formErrors.stock && (
                      <p className="text-red-500 text-sm">{formErrors.stock}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Description *</Label>
                    <RichTextEditor
                      placeholder="Describe the product..."
                      value={formValues.description}
                      onChange={(html) =>
                        handleRichTextChange("description", html)
                      }
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Benefit */}
                  <div className="space-y-2">
                    <Label className="text-white/80">Benefit *</Label>
                    <RichTextEditor
                      placeholder="Describe the benefit..."
                      value={formValues.benefit}
                      onChange={(html) => handleRichTextChange("benefit", html)}
                    />
                    {formErrors.benefit && (
                      <p className="text-red-500 text-sm">
                        {formErrors.benefit}
                      </p>
                    )}
                  </div>
                </div>

                {/* SEO Content Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">SEO Content</h3>

                  {/* SEO Title */}
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

                  {/* Meta Description */}
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

                  {/* Meta Keywords */}
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

              {/* General Error Message */}
              {formErrors.general && (
                <p className="text-red-500 text-sm">{formErrors.general}</p>
              )}

              {/* Form Actions */}
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
                  {isSubmitting ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditProductForm;