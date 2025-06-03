"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, ArrowLeft, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { ICategory, ISubCategory } from "@/types";
import { Types } from "mongoose";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useDebounce } from "@/hooks/useDebounce";

// Utility to generate slug from product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

interface FormValues {
  productName: string;
  price: string;
  stockQuantity: string;
  description: string;
  benefit: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

interface FormErrors {
  productName: string;
  categories: string;
  subcategories: string;
  price: string;
  stockQuantity: string;
  description: string;
  benefit: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  images: string;
  general: string;
}

// Extended interface to include parentId for subcategories
interface ICategoryWithParent extends Omit<ISubCategory, 'category'> {
  parentId?: string;
  category_id?: string;
  category?: (ICategory | string | Types.ObjectId)[] | ICategory | string | Types.ObjectId;
}

const AddProductForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    useState<boolean>(false);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] =
    useState<boolean>(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [subcategories, setSubcategories] = useState<ICategoryWithParent[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const [subcategorySearchTerm, setSubcategorySearchTerm] =
    useState<string>("");
  const [currency, setCurrency] = useState<"USD" | "NPR" | "">("NPR");
  const debouncedCategorySearchTerm = useDebounce(categorySearchTerm, 1000);
  const debouncedSubcategorySearchTerm = useDebounce(
    subcategorySearchTerm,
    1000
  );
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Conversion rate (1 USD = 135 NPR, replace with API if needed)
  const CONVERSION_RATE_USD_TO_NPR = 135;

  // State for form values and errors
  const [formValues, setFormValues] = useState<FormValues>({
    productName: "",
    price: "",
    stockQuantity: "",
    description: "",
    benefit: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    productName: "",
    categories: "",
    subcategories: "",
    price: "",
    stockQuantity: "",
    description: "",
    benefit: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    images: "",
    general: "",
  });

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
          setCurrency("NPR"); // Default to NPR if no currency is set
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
        setCurrency("NPR"); // Fallback to NPR
      }
    };

    fetchCurrency();
  }, [admin]);

  // Handle click outside for dropdowns
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Redirect if not authorized
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/products");
    }
  }, [admin, router]);

  // Fetch categories and subcategories
  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;

    const fetchCategoriesAndSubcategories = async () => {
      try {
        // Fetch categories
        const categoryResponse = await fetch("/api/category", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!categoryResponse.ok) {
          const errorData = await categoryResponse.json();
          throw new Error(
            errorData.message ||
            `Failed to fetch categories: ${categoryResponse.status}`
          );
        }

        const categoryResult = await categoryResponse.json();
        const fetchedCategories = categoryResult.data?.categories || [];
        setCategories(fetchedCategories);
        // Fetch subcategories
        const subcategoryResponse = await fetch("/api/subcategory", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!subcategoryResponse.ok) {
          const errorData = await subcategoryResponse.json();
          throw new Error(
            errorData.message ||
            `Failed to fetch subcategories: ${subcategoryResponse.status}`
          );
        }

        const subcategoryResult = await subcategoryResponse.json();

        // Access the categories array from the response
        const subcategoriesData = subcategoryResult.data?.categories || [];

        // First, process all categories to create a map of category IDs to their names
        const categoryMap = new Map<string, string>();
        fetchedCategories.forEach((cat: ICategory) => {
          if (cat.id) {
            categoryMap.set(cat.id, cat.name);
          }
        });

        // Process subcategories and ensure they have the correct parent category
        const processedSubcategories = subcategoriesData.flatMap((sub: ICategoryWithParent) => {


          const extractCategoryId = (category: { id?: string | number; _id?: string | number } | string | { toString(): string } | null | undefined): string | null => {
            if (!category) return null;

            if (Array.isArray(category)) {
              return extractCategoryId(category[0]);
            }

            if (typeof category === 'object' && category !== null && ('id' in category || '_id' in category)) {
              const idValue = ('id' in category && category.id) || ('_id' in category && category.id);
              return idValue ? idValue.toString() : null;
            }

            return category.toString();
          };

          const possibleParentIds = [
            sub.parentId,
            sub.category_id,
            extractCategoryId(sub.category)
          ].filter(Boolean);

          return possibleParentIds.map(parentId => {
            if (!parentId) return null;

            const parentName = categoryMap.get(parentId.toString()) || 'Unknown Category';

            return {
              ...sub,
              id: sub.id,
              name: sub.name,
              parentId: parentId.toString(),
              parentName: parentName
            };
          }).filter(Boolean);
        }).filter(Boolean);

        setSubcategories(processedSubcategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFormErrors((prev) => ({
          ...prev,
          categories: "Failed to load categories.",
          subcategories: "Failed to load subcategories.",
        }));
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategoriesAndSubcategories();
  }, [admin, router]);

  // Reset selected subcategories when categories change
  useEffect(() => {
    if (selectedCategories.length > 0) {
      setSelectedSubcategories((prev) =>
        prev.filter((subId) => {
          const subcategory = subcategories.find((sub: ICategoryWithParent) => sub.id === subId);
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
    } else {
      setSelectedSubcategories([]);
    }
  }, [selectedCategories, subcategories]);

  const validateField = (
    name: string,
    value: string | string[] | number
  ): string => {
    let error = "";
    switch (name) {
      case "productName":
        if (typeof value !== "string" || !value.trim()) {
          error = "Product name cannot be empty.";
        }
        break;
      case "categories":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least one category must be selected.";
        }
        break;
      case "subcategories":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least one subcategory must be selected.";
        }
        break;
      case "price":
        if (typeof value !== "string") {
          error = "Price must be a valid number.";
        } else if (!value) {
          error = "Price cannot be empty.";
        } else {
          const priceValue = parseFloat(value);
          if (isNaN(priceValue) || priceValue <= 0) {
            error = "Price must be a valid positive number.";
          }
        }
        break;
      case "stockQuantity":
        if (typeof value !== "string") {
          error = "Stock quantity must be a valid number.";
        } else if (!value) {
          error = "Stock quantity cannot be empty.";
        } else {
          const stockValue = parseInt(value, 10);
          if (isNaN(stockValue) || stockValue < 0) {
            error = "Stock quantity must be a valid non-negative number.";
          }
        }
        break;
      case "description":
        if (typeof value !== "string" || !value.trim()) {
          error = "Description cannot be empty.";
        }
        break;
      case "benefit":
        if (typeof value !== "string" || !value.trim()) {
          error = "Benefit cannot be empty.";
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
      case "images":
        if (Array.isArray(value) && value.length === 0) {
          error = "At least one image must be uploaded.";
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => {
        if (file.size > 2 * 1024 * 1024) {
          setFormErrors((prev) => ({
            ...prev,
            images: "File size exceeds 2MB limit.",
          }));
          return null;
        }
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImages)
        .then((images) => {
          const filteredImages = images.filter(Boolean) as string[];
          setSelectedImages((prev) => {
            const updatedImages = [...prev, ...filteredImages];
            const error = validateField("images", updatedImages);
            setFormErrors((prev) => ({ ...prev, images: error }));
            return updatedImages;
          });
        })
        .catch(() => {
          setFormErrors((prev) => ({
            ...prev,
            images: "Error uploading images.",
          }));
        });
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      const error = validateField("images", newImages);
      setFormErrors((prev) => ({ ...prev, images: error }));
      return newImages;
    });
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

    // Close category dropdown and open subcategory dropdown if a category is selected
    if (!selectedCategories.includes(categoryId)) {
      setIsCategoryDropdownOpen(false);
      setIsSubcategoryDropdownOpen(true);
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const subcategory = subcategories.find((sub) => sub.id === subcategoryId);

    // Only allow toggling if the subcategory's parent category is selected
    if (subcategory && selectedCategories.includes(subcategory.parentId || "")) {
      setSelectedSubcategories((prev) => {
        const newSubcategories = prev.includes(subcategoryId)
          ? prev.filter((sub) => sub !== subcategoryId)
          : [...prev, subcategoryId];
        const error = validateField("subcategories", newSubcategories);
        setFormErrors((prev) => ({ ...prev, subcategories: error }));
        return newSubcategories;
      });
    }
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      productName: "",
      price: "",
      stockQuantity: "",
      description: "",
      benefit: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
    });
    setFormErrors({
      productName: "",
      categories: "",
      subcategories: "",
      price: "",
      stockQuantity: "",
      description: "",
      benefit: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      images: "",
      general: "",
    });
    setSelectedImages([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setIsCategoryDropdownOpen(false);
    setIsSubcategoryDropdownOpen(false);
    setCategorySearchTerm("");
    setSubcategorySearchTerm("");
  };

  const handleRichTextChange = (name: string, html: string) => {
    setFormValues((prev) => ({ ...prev, [name]: html }));
    const error = validateField(name, html);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      productName: validateField("productName", formValues.productName),
      categories: validateField("categories", selectedCategories),
      subcategories: validateField("subcategories", selectedSubcategories),
      price: validateField("price", formValues.price),
      stockQuantity: validateField("stockQuantity", formValues.stockQuantity),
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add products.");
      router.push("/admin/dashboard/products");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    // Convert price to NPR if entered in USD
    const priceValue = parseFloat(formValues.price);
    const priceInNPR =
      currency === "USD" ? priceValue * CONVERSION_RATE_USD_TO_NPR : priceValue;

    const data = {
      name: formValues.productName.trim(),
      slug: generateSlug(formValues.productName.trim()),
      category: selectedCategories,
      subcategory: selectedSubcategories,
      price: priceInNPR,
      stock: parseInt(formValues.stockQuantity, 10),
      description: formValues.description.trim(),
      benefit: formValues.benefit.trim(),
      seoTitle: formValues.seoTitle.trim() || undefined,
      metaDescription: formValues.metaDescription.trim() || undefined,
      metaKeywords: formValues.metaKeywords.trim() || undefined,
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add product.");
      }

      toast.success("Product added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/products");
    } catch (error) {
      console.error("Add Product Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while adding the product.";
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on debounced search term
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(debouncedCategorySearchTerm.toLowerCase().trim())
  );

  // Filter subcategories based on selected categories and search term
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

      // Also check parentId for backward compatibility
      const hasMatchingParent = selectedCategories.some(catId =>
        catId === subcategory.parentId ||
        (typeof subcategory.category_id === 'string' && catId === subcategory.category_id)
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
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Add New Product</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-5xl mx-auto">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                <h3 className="text-lg font-bold text-white">
                  Product Details
                </h3>
                <div className="space-y-2">
                  <Label className="text-white/80">Product Image</Label>
                  <div className="relative group w-full max-w-md mx-auto">
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${formErrors.images ? "border-red-500" : "border-white/30"
                        }`}
                    >
                      {selectedImages.length > 0 ? (
                        <div className="w-full p-2 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {selectedImages.map((image, index) => (
                            <div key={index} className="relative aspect-square">
                              <Image
                                src={image}
                                alt={`Preview ${index + 1}`}
                                width={100}
                                height={100}
                                className="object-cover w-full h-full rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
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
                            PNG, JPG (max. 2MB)
                          </span>
                        </>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
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

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/80">Product Name *</Label>
                    <Input
                      name="productName"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.productName
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter product name"
                      value={formValues.productName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.productName && (
                      <p className="text-red-500 text-sm">
                        {formErrors.productName}
                      </p>
                    )}
                  </div>

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
                          {loadingCategories ? (
                            <div className="px-4 py-2 text-white/70">
                              Loading categories...
                            </div>
                          ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <div
                                key={category.id}
                                className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${selectedCategories.includes(category.id ?? "")
                                  ? "bg-purple-600/70"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleCategoryToggle(category.id ?? "")
                                }
                              >
                                <span>{category.name}</span>
                                {selectedCategories.includes(
                                  category.id ?? ""
                                ) && <span className="text-green-400">✓</span>}
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
                        disabled={
                          isSubmitting || selectedCategories.length === 0
                        }
                      >
                        <div className="flex flex-wrap gap-2">
                          {selectedSubcategories.length > 0 ? (
                            selectedSubcategories.map((subcategoryId) => (
                              <span
                                key={subcategoryId}
                                className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                              >
                                {
                                  subcategories.find(
                                    (sub) => sub.id === subcategoryId
                                  )?.name
                                }
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
                            ))
                          ) : (
                            <span className="text-white/50">
                              {selectedCategories.length === 0
                                ? "Select categories first"
                                : "Select subcategories"}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-white/50 transition-transform ${isSubcategoryDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      {isSubcategoryDropdownOpen &&
                        selectedCategories.length > 0 && (
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
                            {loadingCategories ? (
                              <div className="px-4 py-2 text-white/70">
                                Loading subcategories...
                              </div>
                            ) : filteredSubcategories.length > 0 ? (
                              filteredSubcategories.map((subcategory) => (
                                <div
                                  key={subcategory.id}
                                  className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${selectedSubcategories.includes(
                                    subcategory.id ?? ""
                                  )
                                    ? "bg-purple-600/70"
                                    : ""
                                    }`}
                                  onClick={() =>
                                    handleSubcategoryToggle(
                                      subcategory.id ?? ""
                                    )
                                  }
                                >
                                  <span>{subcategory.name}</span>
                                  {selectedSubcategories.includes(
                                    subcategory.id ?? ""
                                  ) && (
                                      <span className="text-green-400">✓</span>
                                    )}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-white/70">
                                No subcategories found
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
                      onBlur={handleBlur}
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm">{formErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Stock Quantity *</Label>
                    <Input
                      name="stockQuantity"
                      type="number"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.stockQuantity
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter quantity"
                      value={formValues.stockQuantity}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      min="0"
                      disabled={isSubmitting}
                    />
                    {formErrors.stockQuantity && (
                      <p className="text-red-500 text-sm">
                        {formErrors.stockQuantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Description *</Label>
                    <RichTextEditor
                      placeholder="Describe the product..."
                      onChange={(html) =>
                        handleRichTextChange("description", html)
                      }
                      value={formValues.description}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

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
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">SEO Content</h3>
                <div className="space-y-2">
                  <Label className="text-white/80">SEO Title</Label>
                  <Input
                    name="seoTitle"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.seoTitle ? "border-red-500" : "border-white/20"
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
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductForm;
