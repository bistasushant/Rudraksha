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
  feature: boolean;
  sizes: { sizeId: string; price: string }[];
  designs: { image: string; title: string; price: string }[];
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
  feature: string;
  sizes: string;
  designs: string;
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
  const [sizes, setSizes] = useState<{ id: string; size: string; isActive: boolean }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<{ 
    sizeId: string; 
    price: string; 
    size: string;
    isActive: boolean;
  }[]>([]);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState<boolean>(false);
  const [sizeSearchTerm, setSizeSearchTerm] = useState<string>("");
  const debouncedSizeSearchTerm = useDebounce(sizeSearchTerm, 1000);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedDesigns, setSelectedDesigns] = useState<{ image: string; title: string; price: string }[]>([]);
  const [isDesignUploading, setIsDesignUploading] = useState<boolean>(false);


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
    feature: false,
    sizes: [],
    designs: [],
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
    feature: "",
    sizes: "",
    designs: "",
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
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSizeDropdownOpen(false);
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

    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch("/api/category", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }

        const categoriesResult = await categoriesResponse.json();
        setCategories(categoriesResult.data?.categories || []);

        // Fetch subcategories
        const subcategoriesResponse = await fetch("/api/subcategory", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!subcategoriesResponse.ok) {
          throw new Error("Failed to fetch subcategories");
        }

        const subcategoriesResult = await subcategoriesResponse.json();
        setSubcategories(subcategoriesResult.data?.categories || []);

        // Fetch sizes
        const sizesResponse = await fetch("/api/size", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!sizesResponse.ok) {
          throw new Error("Failed to fetch sizes");
        }

        const sizesResult = await sizesResponse.json();
        if (sizesResult.data?.productSizes) {
          setSizes(sizesResult.data.productSizes);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data. Please try again.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [admin]);

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
    value: string | string[] | number | boolean | { sizeId: string; price: string }[] | { image: string; title: string; price: string }[]
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
      case "feature":
        if (typeof value !== "boolean") {
          error = "Feature must be a boolean.";
        }
        break;
      case "sizes":
        if (Array.isArray(value)) {
          const sizes = value as { sizeId: string; price: string }[];
          if (sizes.length === 0) {
            error = "At least one size must be selected.";
          } else {
            const invalidSize = sizes.find(
              (size) => 
                !size.sizeId || 
                !size.price || 
                isNaN(Number(size.price)) || 
                Number(size.price) < 0
            );
            if (invalidSize) {
              error = "All selected sizes must have a valid non-negative price.";
            }
          }
        } else {
          error = "Sizes must be an array.";
        }
        break;
      case "designs":
        if (Array.isArray(value)) {
          const designs = value as { image: string; title: string; price: string }[];
          if (designs.length > 5) {
            error = "Maximum 5 designs allowed per product.";
          } else {
            const invalidDesign = designs.find(
              design => !design.title.trim() || !design.price || isNaN(Number(design.price)) || Number(design.price) <= 0
            );
            if (invalidDesign) {
              error = "All designs must have a title and valid price greater than 0.";
            }
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
    setSelectedSubcategories((prev) => {
      const newSubcategories = prev.includes(subcategoryId)
        ? prev.filter((sub) => sub !== subcategoryId)
        : [...prev, subcategoryId];
      const error = validateField("subcategories", newSubcategories);
      setFormErrors((prev) => ({ ...prev, subcategories: error }));
      return newSubcategories;
    });
  };

  const handleSizeToggle = (sizeId: string) => {
    const size = sizes.find((s) => s.id === sizeId);
    if (!size || !size.isActive || !size.id) return;

    setSelectedSizes((prev) => {
      const isSelected = prev.some((s) => s.sizeId === sizeId);
      if (isSelected) {
        return prev.filter((s) => s.sizeId !== sizeId);
      } else {
        return [...prev, { 
          sizeId: size.id,
          price: "",
          size: size.size,
          isActive: size.isActive 
        }];
      }
    });
  };

  const handleSizePriceChange = (sizeId: string, price: string) => {
    setSelectedSizes((prev) =>
      prev.map((size) =>
        size.sizeId === sizeId ? { ...size, price } : size
      )
    );
    // Validate sizes after price change
    const updatedSizes = selectedSizes.map(size =>
      size.sizeId === sizeId ? { ...size, price } : size
    );
    const error = validateField("sizes", updatedSizes);
    setFormErrors(prev => ({ ...prev, sizes: error }));
  };

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectedDesigns.length >= 5) {
      toast.error("Maximum 5 designs allowed per product");
      return;
    }

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit");
      return;
    }

    setIsDesignUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedDesigns(prev => [...prev, {
        image: reader.result as string,
        title: "",
        price: ""
      }]);
      setIsDesignUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDesignRemove = (index: number) => {
    setSelectedDesigns(prev => prev.filter((_, i) => i !== index));
  };

  const handleDesignChange = (index: number, field: 'title' | 'price', value: string) => {
    setSelectedDesigns(prev => prev.map((design, i) => 
      i === index ? { ...design, [field]: value } : design
    ));
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
      feature: false,
      sizes: [],
      designs: [],
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
      feature: "",
      sizes: "",
      designs: "",
    });
    setSelectedImages([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setIsCategoryDropdownOpen(false);
    setIsSubcategoryDropdownOpen(false);
    setIsSizeDropdownOpen(false);
    setCategorySearchTerm("");
    setSubcategorySearchTerm("");
    setSizeSearchTerm("");
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
      feature: validateField("feature", formValues.feature),
      sizes: validateField("sizes", selectedSizes),
      designs: validateField("designs", selectedDesigns),
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

    // Validate sizes before form submission
    const sizeError = validateField("sizes", selectedSizes);
    if (sizeError) {
      setFormErrors(prev => ({ ...prev, sizes: sizeError }));
      toast.error(sizeError);
      setIsSubmitting(false);
      return;
    }
  
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    // Validate that all sizes have both sizeId and price
    const validSizes = selectedSizes.filter(size => 
      size.sizeId && 
      size.price && 
      !isNaN(Number(size.price)) && 
      Number(size.price) > 0
    );
    
    const data = {
      name: formValues.productName.trim(),
      slug: generateSlug(formValues.productName.trim()),
      category: selectedCategories,
      subcategory: selectedSubcategories,
      sizes: validSizes.map(size => ({
        sizeId: size.sizeId,
        price: Math.round(Number(size.price))
      })),
      price: Math.round(Number(formValues.price)),
      stock: parseInt(formValues.stockQuantity, 10),
      description: formValues.description.trim(),
      benefit: formValues.benefit.trim(),
      feature: Boolean(formValues.feature),
      seoTitle: formValues.seoTitle.trim() || undefined,
      metaDescription: formValues.metaDescription.trim() || undefined,
      metaKeywords: formValues.metaKeywords.trim() || undefined,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      designs: selectedDesigns.map(design => ({
        image: design.image,
        title: design.title.trim(),
        price: Math.round(Number(design.price))
      })),
    };
  
    // Enhanced debug log
    console.log("Submitting product data:", JSON.stringify(data, null, 2));
  
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

  // Helper function to get category ID
  const getCategoryId = (cat: string | { id?: string | Types.ObjectId; _id?: string | Types.ObjectId } | Types.ObjectId | null): string | null => {
    if (!cat) return null;
    if (typeof cat === 'object' && cat !== null) {
      if ('id' in cat && cat.id) return cat.id.toString();
      if ('_id' in cat && cat._id) return cat._id.toString();
      if (cat instanceof Types.ObjectId) return cat.toString();
      return null;
    }
    return cat.toString();
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
      // Check if the subcategory belongs to any of the selected categories
      const belongsToSelectedCategory = selectedCategories.some(catId => {
        // Check parentId first (most reliable)
        if (subcategory.parentId === catId) return true;
        
        // Check category_id (backward compatibility)
        if (subcategory.category_id === catId) return true;
        
        // Check category array/object
        if (subcategory.category) {
          if (Array.isArray(subcategory.category)) {
            return subcategory.category.some(cat => {
              const categoryId = getCategoryId(cat);
              return categoryId === catId;
            });
          } else {
            const categoryId = getCategoryId(subcategory.category);
            return categoryId === catId;
          }
        }
        
        return false;
      });

      const matchesSearch = subcategory.name
        .toLowerCase()
        .includes(debouncedSubcategorySearchTerm.toLowerCase().trim());

      return belongsToSelectedCategory && matchesSearch;
    });
  }, [subcategories, selectedCategories, debouncedSubcategorySearchTerm]);

  // Filter sizes based on search term
  const filteredSizes = useMemo(() => {
    console.log('Available sizes:', sizes);
    return sizes
      .filter((size) => {
        console.log('Size:', size);
        return size && size.isActive && size.id && size.size;
      })
      .filter((size) =>
        size.size.toLowerCase().includes(debouncedSizeSearchTerm.toLowerCase().trim())
      );
  }, [sizes, debouncedSizeSearchTerm]);

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

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
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
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                      <p className="text-sm text-white/60 font-medium">Recommended size: 1280 x 720 pixels</p>
                    </div>
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
                      placeholder="0"
                      value={formValues.price}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      min="0"
                      step="1"
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="feature"
                        name="feature"
                        checked={formValues.feature}
                        onChange={(e) => {
                          setFormValues(prev => ({
                            ...prev,
                            feature: e.target.checked
                          }));
                          const error = validateField("feature", e.target.checked);
                          setFormErrors(prev => ({ ...prev, feature: error }));
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="feature" className="text-white/80">
                        Mark as Feature Product
                      </Label>
                    </div>
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
              <div className="space-y-2">
                    <Label className="text-white/80">Designs (Max 5)</Label>
                    <div className="space-y-4">
                      {selectedDesigns.map((design, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/20">
                          <div className="flex justify-between items-start mb-4">
                            <div className="relative w-24 h-24">
                              <Image
                                src={design.image}
                                alt={`Design ${index + 1}`}
                                width={96}
                                height={96}
                                className="object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleDesignRemove(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            </div>
                            <div className="flex-1 ml-4 space-y-2">
                              <Input
                                placeholder="Design Title"
                                value={design.title}
                                onChange={(e) => handleDesignChange(index, 'title', e.target.value)}
                                className="bg-white/5 border-white/20 text-white"
                              />
                              <Input
                                type="number"
                                placeholder="Design Price"
                                value={design.price}
                                onChange={(e) => handleDesignChange(index, 'price', e.target.value)}
                                className="bg-white/5 border-white/20 text-white"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedDesigns.length < 5 && (
                        <div className="relative group">
                          <label
                            htmlFor="design-upload"
                            className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors border-white/30"
                          >
                            <Upload className="h-8 w-8 text-white/50 mb-2 group-hover:text-purple-400" />
                            <span className="text-white/70 group-hover:text-purple-400">
                              Click to upload design
                            </span>
                            <span className="text-sm text-white/50">
                              PNG, JPG (max. 2MB)
                            </span>
                          </label>
                          <input
                            id="design-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleDesignUpload}
                            disabled={isDesignUploading}
                          />
                        </div>
                      )}
                    </div>
                    {formErrors.designs && (
                      <p className="text-red-500 text-sm">{formErrors.designs}</p>
                    )}
                     <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                      <p className="text-sm text-white/60 font-medium">Recommended size: 1024 x 1024 pixels</p>
                    </div>
                  </div>
                  
              <div className="space-y-2" ref={sizeDropdownRef}>
                    <Label className="text-white/80">Sizes and Prices *</Label>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${
                          formErrors.sizes ? "border-red-500 border" : "border-white/20"
                        }`}
                        onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-wrap gap-2">
                          {selectedSizes.length > 0 ? (
                            selectedSizes.map((selectedSize) => (
                              <span
                                key={`selected-${selectedSize.sizeId}`}
                                className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                              >
                                {selectedSize.size} - {currency === "USD" ? "$" : "Rs"}{selectedSize.price}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSizeToggle(selectedSize.sizeId);
                                  }}
                                  className="ml-1 text-white/80 hover:text-white cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-white/50">Select sizes</span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-white/50 transition-transform ${
                            isSizeDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isSizeDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <Input
                              placeholder="Search sizes..."
                              value={sizeSearchTerm}
                              onChange={(e) => setSizeSearchTerm(e.target.value)}
                              className="bg-white/5 border-white/20 text-white w-full"
                              disabled={isSubmitting}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {loadingCategories ? (
                            <div className="px-4 py-2 text-white/70">Loading sizes...</div>
                          ) : filteredSizes.length > 0 ? (
                            filteredSizes.map((size) => (
                              <div
                                key={`size-${size.id}`}
                                className={`px-4 py-2 cursor-pointer hover:bg-white/5 text-white hover:text-white ${
                                  selectedSizes.some((s) => s.sizeId === size.id)
                                    ? "bg-purple-600/5"
                                    : ""
                                }`}
                                onClick={() => handleSizeToggle(size.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{size.size}</span>
                                  {selectedSizes.some((s) => s.sizeId === size.id) && (
                                    <span className="text-green-400">✓</span>
                                  )}
                                </div>
                                {selectedSizes.some((s) => s.sizeId === size.id) && (
                                  <div className="mt-2">
                                    <Input
                                      type="number"
                                      placeholder="Enter price"
                                      value={selectedSizes.find((s) => s.sizeId === size.id)?.price || ""}
                                      onChange={(e) => handleSizePriceChange(size.id, e.target.value)}
                                      className="bg-white/5 border-white/20 text-white w-full"
                                      min="0"
                                      step="0.01"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-white/70">No sizes found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.sizes && (
                      <p className="text-red-500 text-sm">{formErrors.sizes}</p>
                    )}
                  </div>
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
