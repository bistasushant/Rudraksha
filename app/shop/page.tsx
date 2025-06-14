"use client";
import { useState, useMemo, useEffect } from "react";
import { ProductCard } from "@/components/Product-Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  X,
  Search,
  Filter,
  Sparkles,
  Grid3X3,
  List,
  ShoppingBag,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/context/language-context";
import {
  shopEnglishTexts,
  shopChineseTexts,
  shopHindiTexts,
  shopNepaliTexts,
} from "@/language";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useDebounce } from "@/hooks/useDebounce";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  parentId?: string;
  allParentIds?: string[];
}

interface ApiSubcategory {
  id?: string;
  _id?: string | { toString(): string };
  name?: string;
  category?:
    | Array<{ _id?: string | { toString(): string }; id?: string }>
    | string
    | { _id?: string | { toString(): string }; id?: string };
  categoryId?: string | { _id?: string | { toString(): string }; id?: string };
}

interface EnhancedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string[];
  subcategory: string[];
  categoryNames?: string[];
  subcategoryNames?: string[];
  stock?: number;
  description?: string;
  benefit?: string;
  rating?: number;
  mukhi?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: Date;
  sizes?: { size: string; price: number }[];
  designs?: string[];
}

export default function ShopPage() {
  const { selectedLanguage } = useLanguage();

  // State for data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const [sortOption, setSortOption] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Price filter states
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("5000");
  const [minMaxPrice, setMinMaxPrice] = useState({ min: 0, max: 5000 });
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const debouncedMinPrice = useDebounce(minPrice, 1000);
  const debouncedMaxPrice = useDebounce(maxPrice, 1000);
  const debouncedPriceRange = useDebounce(JSON.stringify(priceRange), 1000);

  // Language texts
  const shopTexts =
    selectedLanguage === "chinese"
      ? shopChineseTexts
      : selectedLanguage === "hindi"
      ? shopHindiTexts
      : selectedLanguage === "nepali"
      ? shopNepaliTexts
      : shopEnglishTexts;

  // Fetch categories, subcategories, and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await fetch("/api/category");
        if (!categoriesResponse.ok)
          throw new Error("Failed to fetch categories");
        const categoriesResult = await categoriesResponse.json();
        const fetchedCategories = categoriesResult.data?.categories || [];
        setCategories(fetchedCategories);

        // Fetch subcategories
        const subcategoriesResponse = await fetch("/api/subcategory");
        if (!subcategoriesResponse.ok)
          throw new Error("Failed to fetch subcategories");
        const subcategoriesResult = await subcategoriesResponse.json();
        const fetchedSubcategories = subcategoriesResult.data?.categories || [];

        // Create a mapping of category IDs for easier reference
        const categoryIdMap: Record<string, boolean> = {};
        fetchedCategories.forEach((cat: Category) => {
          categoryIdMap[cat.id] = true;
        });

        const transformedSubcategories = fetchedSubcategories.map(
          (sub: ApiSubcategory) => {
            const subId =
              sub.id ||
              (sub._id
                ? typeof sub._id === "string"
                  ? sub._id
                  : sub._id.toString()
                : "");
            const subName = sub.name || "Unnamed Subcategory";
            const parentIds: string[] = [];

            if (sub.category) {
              if (typeof sub.category === "string") {
                parentIds.push(sub.category);
              } else if (Array.isArray(sub.category)) {
                for (const cat of sub.category) {
                  if (typeof cat === "string") {
                    parentIds.push(cat);
                  } else if (typeof cat === "object") {
                    if (cat._id && cat._id !== undefined) {
                      const catId =
                        typeof cat._id === "string"
                          ? cat._id
                          : cat._id.toString();
                      parentIds.push(catId);
                    } else if (cat.id && cat.id !== undefined) {
                      parentIds.push(cat.id);
                    }
                  }
                }
              } else if (typeof sub.category === "object") {
                if (sub.category._id && sub.category._id !== undefined) {
                  const catId =
                    typeof sub.category._id === "string"
                      ? sub.category._id
                      : sub.category._id.toString();
                  parentIds.push(catId);
                } else if (sub.category.id && sub.category.id !== undefined) {
                  parentIds.push(sub.category.id);
                }
              }
            }

            if (
              (parentIds.length === 0 ||
                !parentIds.some((id) => categoryIdMap[id])) &&
              sub.categoryId
            ) {
              const catId =
                typeof sub.categoryId === "string"
                  ? sub.categoryId
                  : sub.categoryId._id
                  ? sub.categoryId._id.toString()
                  : sub.categoryId.toString();
              parentIds.push(catId);
            }

            const primaryParentId = parentIds.length > 0 ? parentIds[0] : null;

            return {
              id: subId,
              name: subName,
              parentId: primaryParentId,
              allParentIds: parentIds,
            };
          }
        );

        setSubcategories(transformedSubcategories);

        // Fetch products
        const productsResponse = await fetch("/api/products");
        if (!productsResponse.ok) throw new Error("Failed to fetch products");
        const productsResult = await productsResponse.json();
        const fetchedProducts = productsResult.data?.products || [];

        // Enhance products with category and subcategory names
        const enhancedProducts = fetchedProducts.map(
          (product: EnhancedProduct) => {
            const categoryArray = Array.isArray(product.category)
              ? product.category
              : product.category
              ? [product.category]
              : [];
            const subcategoryArray = Array.isArray(product.subcategory)
              ? product.subcategory
              : product.subcategory
              ? [product.subcategory]
              : [];

            const categoryNames = categoryArray.map((catId) => {
              const category = fetchedCategories.find(
                (cat: Category) => cat.id === catId
              );
              return category ? category.name : `Unknown Category (${catId})`;
            });

            const subcategoryNames = subcategoryArray.map((subId) => {
              const subcategory = transformedSubcategories.find(
                (sub: Subcategory) => sub.id === subId
              );
              return subcategory
                ? subcategory.name
                : `Unknown Subcategory (${subId})`;
            });

            return {
              ...product,
              category: categoryArray,
              subcategory: subcategoryArray,
              categoryNames,
              subcategoryNames,
              images: product.images || [
                product.image || "/images/default-image.png",
              ],
            };
          }
        );

        setProducts(enhancedProducts);

        // Set price range based on products
        if (enhancedProducts.length > 0) {
          const min = Math.max(
            0,
            Math.min(
              ...enhancedProducts.map((p: EnhancedProduct) =>
                Number(p.price || 0)
              )
            )
          );
          const max = Math.min(
            5000,
            Math.max(
              ...enhancedProducts.map((p: EnhancedProduct) =>
                Number(p.price || 0)
              )
            )
          );
          setMinMaxPrice({ min, max });
          setPriceRange([min, max]);
          setMinPrice(min.toString());
          setMaxPrice(max.toString());
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset subcategories when categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setSelectedSubcategories([]);
    } else {
      setSelectedSubcategories((prev) =>
        prev.filter((subId) => {
          const subcategory = subcategories.find((sub) => sub.id === subId);
          return (
            subcategory?.parentId &&
            selectedCategories.includes(subcategory.parentId)
          );
        })
      );
    }
  }, [selectedCategories, subcategories]);

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return (
      selectedCategories.length > 0 ||
      selectedSubcategories.length > 0 ||
      showInStockOnly ||
      searchQuery.length > 0 ||
      (isPriceFilterActive &&
        (priceRange[0] > minMaxPrice.min || priceRange[1] < minMaxPrice.max))
    );
  }, [
    selectedCategories,
    selectedSubcategories,
    showInStockOnly,
    searchQuery,
    priceRange,
    minMaxPrice,
    isPriceFilterActive,
  ]);

  // Filter handlers
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    setSelectedSubcategories((prev) =>
      checked
        ? [...prev, subcategoryId]
        : prev.filter((id) => id !== subcategoryId)
    );
  };

  const handleInStockChange = (checked: boolean) => setShowInStockOnly(checked);

  // Price filter handlers
  const handlePriceInputChange = (type: "min" | "max", value: string) => {
    // Allow empty string for backspace
    if (value === "") {
      if (type === "min") setMinPrice("");
      else setMaxPrice("");
      return;
    }

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const numValue = Number(value);
    if (isNaN(numValue)) return;

    setIsPriceFilterActive(true);

    if (type === "min") {
      const validMin = Math.max(0, Math.min(numValue, Number(maxPrice) - 10));
      setMinPrice(validMin.toString());
    } else {
      const validMax = Math.min(
        5000,
        Math.max(numValue, Number(minPrice) + 10)
      );
      setMaxPrice(validMax.toString());
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (value.length === 2) {
      setIsDragging(true);
      setPriceRange(value);
      setMinPrice(value[0].toString());
      setMaxPrice(value[1].toString());
    }
  };

  const handleSliderChangeEnd = () => {
    setIsDragging(false);
    setIsPriceFilterActive(true);
  };

  // Effect to handle debounced price changes
  useEffect(() => {
    if (!isDragging && debouncedMinPrice !== "" && debouncedMaxPrice !== "") {
      const min = Number(debouncedMinPrice);
      const max = Number(debouncedMaxPrice);
      if (!isNaN(min) && !isNaN(max)) {
        setPriceRange([min, max]);
      }
    }
  }, [debouncedMinPrice, debouncedMaxPrice, isDragging]);

  // Effect to handle debounced slider changes
  useEffect(() => {
    if (!isDragging) {
      setIsPriceFilterActive(true);
    }
  }, [debouncedPriceRange, isDragging]);

  const handlePriceInputBlur = (type: "min" | "max") => {
    if (type === "min" && minPrice === "") {
      setMinPrice("0");
    } else if (type === "max" && maxPrice === "") {
      setMaxPrice("5000");
    }
  };

  // Get selected category and subcategory names
  const selectedCategoryNames = useMemo(() => {
    return categories
      .filter((category) => selectedCategories.includes(category.id))
      .map((category) => category.name);
  }, [categories, selectedCategories]);

  const selectedSubcategoryNames = useMemo(() => {
    return subcategories
      .filter((subcategory) => selectedSubcategories.includes(subcategory.id))
      .map((subcategory) => subcategory.name);
  }, [subcategories, selectedSubcategories]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const passesCategory =
        selectedCategories.length === 0 ||
        product.category.some((catId) => selectedCategories.includes(catId));
      const passesSubcategory =
        selectedSubcategories.length === 0 ||
        product.subcategory.some((subId) =>
          selectedSubcategories.includes(subId)
        );
      const passesStock =
        !showInStockOnly || (product.stock !== undefined && product.stock > 0);

      // Get the base price from the static small size if available, otherwise use product price
      const basePrice =
        product.sizes?.find((size) => "size" in size && size.size === "small")
          ?.price || product.price;
      const passesPrice =
        !isPriceFilterActive ||
        (basePrice >= priceRange[0] && basePrice <= priceRange[1]);

      const passesSearch =
        !debouncedSearchQuery ||
        product.name
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())) ||
        (product.categoryNames &&
          product.categoryNames.some((name) =>
            name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
          )) ||
        (product.subcategoryNames &&
          product.subcategoryNames.some((name) =>
            name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
          ));
      return (
        passesCategory &&
        passesSubcategory &&
        passesStock &&
        passesPrice &&
        passesSearch
      );
    });
  }, [
    products,
    selectedCategories,
    selectedSubcategories,
    showInStockOnly,
    priceRange,
    debouncedSearchQuery,
    isPriceFilterActive,
  ]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortOption) {
      case "price-low":
        return sorted.sort((a, b) => {
          const priceA =
            a.sizes?.find((size) => "size" in size && size.size === "small")
              ?.price || a.price;
          const priceB =
            b.sizes?.find((size) => "size" in size && size.size === "small")
              ?.price || b.price;
          return priceA - priceB;
        });
      case "price-high":
        return sorted.sort((a, b) => {
          const priceA =
            a.sizes?.find((size) => "size" in size && size.size === "small")
              ?.price || a.price;
          const priceB =
            b.sizes?.find((size) => "size" in size && size.size === "small")
              ?.price || b.price;
          return priceB - priceA;
        });
      case "newest":
        return sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      case "rating":
        return sorted.sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
        );
      case "featured":
      default:
        return sorted;
    }
  }, [filteredProducts, sortOption]);

  const getStockSummary = () => {
    const inStock = products.filter(
      (p) => p.stock !== undefined && p.stock > 0
    ).length;
    const total = products.length;
    return `${inStock} of ${total} products in stock`;
  };

  // Clear filter handlers
  const removeCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const removeSubcategoryFilter = (subcategoryId: string) => {
    setSelectedSubcategories((prev) =>
      prev.filter((id) => id !== subcategoryId)
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setShowInStockOnly(false);
    setPriceRange([minMaxPrice.min, minMaxPrice.max]);
    setMinPrice(minMaxPrice.min.toString());
    setMaxPrice(minMaxPrice.max.toString());
    setSearchQuery("");
    setIsPriceFilterActive(false);
  };

  // Filter subcategories based on selected categories
  const filteredSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }

    const filtered = subcategories.filter((subcategory) => {
      if (
        !subcategory.parentId &&
        (!subcategory.allParentIds || subcategory.allParentIds.length === 0)
      ) {
        return false;
      }

      if (selectedCategories.length === 0) {
        return false;
      }

      for (const catId of selectedCategories) {
        const catIdStr = String(catId);

        if (subcategory.parentId && String(subcategory.parentId) === catIdStr) {
          return true;
        }

        if (subcategory.allParentIds && subcategory.allParentIds.length > 0) {
          for (const parentId of subcategory.allParentIds) {
            if (String(parentId) === catIdStr) {
              return true;
            }
          }
        }
      }

      return false;
    });

    return filtered;
  }, [subcategories, selectedCategories]);

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`space-y-8 ${isMobile ? "p-6" : ""}`}>
      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-[#B87333] to-[#D4AF37] rounded-full"></div>
          <h3 className="font-bold text-ivoryWhite text-xl bg-gradient-to-r from-[#F5F5DC] to-gray-300 bg-clip-text">
            {shopTexts.categories}
          </h3>
        </div>
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F5F5DC]/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#600000]/20"
            >
              <Checkbox
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#D4AF37] data-[state=checked]:to-[#600000] border-gray-400 data-[state=checked]:border-[#D4AF37] cursor-pointer"
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) =>
                  handleCategoryChange(category.id, checked === true)
                }
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-[#F5F5DC]/70 cursor-pointer group-hover:text-ivoryWhite transition-colors duration-300 flex-1"
              >
                {category.name}
              </Label>
              <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {
                  products.filter((p) => p.category.includes(category.id))
                    .length
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {selectedCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-[#600000] to-[#D4AF37] rounded-full"></div>
            <h3 className="font-bold text-white text-xl bg-gradient-to-r from-[#600000] to-[#D4AF37] bg-clip-text">
              Subcategories
            </h3>
          </div>
          <div className="space-y-3 pl-4 border-l border-[#600000]/20">
            {filteredSubcategories.length > 0 ? (
              filteredSubcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="group flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F5F5DC]/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#600000]/20"
                >
                  <Checkbox
                    id={`subcategory-${subcategory.id}`}
                    checked={selectedSubcategories.includes(subcategory.id)}
                    onCheckedChange={(checked) =>
                      handleSubcategoryChange(subcategory.id, checked === true)
                    }
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#8B1A1A] data-[state=checked]:to-[#600000] border-gray-400 cursor-pointer"
                  />
                  <Label
                    htmlFor={`subcategory-${subcategory.id}`}
                    className="text-ivoryWhite cursor-pointer group-hover:text-white transition-colors duration-300 flex-1"
                  >
                    {subcategory.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-ivoryWhite text-sm italic">
                No subcategories available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full"></div>
          <h3 className="font-bold text-white text-xl bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text">
            {shopTexts.priceFilter}
          </h3>
        </div>
        <div className="space-y-6 p-4 bg-white/5 rounded-xl border border-green-400/20">
          <div className="space-y-4">
            <Slider
              min={0}
              max={5000}
              step={10}
              value={priceRange}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderChangeEnd}
              className="w-full cursor-pointer"
            />
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>${priceRange[0]}</div>
              <div>${priceRange[1]}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-price" className="text-sm text-gray-300">
                Min ($)
              </Label>
              <Input
                id="min-price"
                type="text"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => handlePriceInputChange("min", e.target.value)}
                onBlur={() => handlePriceInputBlur("min")}
                className="bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 cursor-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-price" className="text-sm text-gray-300">
                Max ($)
              </Label>
              <Input
                id="max-price"
                type="text"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => handlePriceInputChange("max", e.target.value)}
                onBlur={() => handlePriceInputBlur("max")}
                className="bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 cursor-text"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#B87333] rounded-full"></div>
          <h3 className="font-bold text-white text-xl bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text">
            {shopTexts.availability}
          </h3>
        </div>
        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-yellow-400/20">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="in-stock"
              checked={showInStockOnly}
              onCheckedChange={(checked) =>
                handleInStockChange(checked === true)
              }
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-500 data-[state=checked]:to-orange-500 border-gray-400 cursor-pointer"
            />
            <Label htmlFor="in-stock" className="text-gray-300 cursor-pointer">
              {shopTexts.inStock}
            </Label>
          </div>
          <div className="text-sm text-gray-500 bg-white/5 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {getStockSummary()}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {isFilterActive && (
        <Button
          onClick={clearAllFilters}
          className="w-full bg-gradient-to-r from-[#600000] to-[#8B1A1A] hover:from-red-600 hover:to-[#600000] text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/10 rounded-2xl border border-red-500/20">
          <div className="text-red-400 text-xl font-bold mb-2">
            Error Loading Shop
          </div>
          <div className="text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#2A2A2A]/10 via-transparent to-[#B87333]/10 animate-pulse"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8 sm:px-6">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 pt-16 sm:pt-20">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-brassGold animate-spin" />
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-400 via-[#8B1A1A] to-blue-400 bg-clip-text text-transparent">
                {shopTexts.shop}
              </h1>
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-himalayanRed animate-bounce" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-[#F5F5DC]/70 max-w-3xl mx-auto leading-relaxed px-4">
              {shopTexts.h1}
            </p>
            <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto mt-4 sm:mt-6 rounded-full"></div>
          </div>

          {/* Search and Controls Bar */}
          <div className="mb-6 sm:mb-8 space-y-4 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-2 w-full bg-white/5 border-[#] text-white placeholder-gray-400 rounded-full focus:border-orange-500 focus:ring-orange-500 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right controls: Mobile Filter, Sort, View */}
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="lg:hidden flex items-center gap-2 bg-orange-600/20 border-orange-500 text-orange-300 hover:bg-orange-600/30 hover:text-orange-200 transition-all duration-300 rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base"
                    >
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                      Filters
                      {isFilterActive && (
                        <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[85vw] max-w-sm overflow-y-auto bg-gradient-to-br from-slate-900 to-gray-900 text-white border-r border-orange-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    {/* Mobile filter content */}
                    <div className="p-4">
                      <SheetTitle className="text-xl sm:text-2xl font-bold text-white mb-6">
                        Filters
                      </SheetTitle>
                      <FilterSidebar isMobile={true} />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <div className="w-full sm:w-auto relative">
                  <select
                    className="w-full h-9 sm:h-10 rounded-full border border-gray-700 bg-white/5 px-3 sm:px-5 py-2 text-sm text-ivoryWhite appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 cursor-pointer pr-8"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="featured" className="bg-deepGraphite text-ivoryWhite">Featured</option>
                    <option value="price-low" className="bg-deepGraphite text-ivoryWhite">Price: Low to High</option>
                    <option value="price-high" className="bg-deepGraphite text-ivoryWhite">Price: High to Low</option>
                    <option value="newest" className="bg-deepGraphite text-ivoryWhite">Newest</option>
                    <option value="rating" className="bg-deepGraphite text-ivoryWhite">Highest Rated</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center rounded-full border border-gray-700 bg-white/5 p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-full transition-colors duration-200 ${
                      viewMode === "grid"
                        ? "bg-himalayanRed text-white hover:bg-himalayanRed hover:text-white"
                        : "text-gray-400 hover:bg-himalayanRed hover:text-white"
                    }`}
                    aria-label="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`rounded-full transition-colors duration-200 ${
                      viewMode === "list"
                        ? "bg-himalayanRed text-white hover:bg-himalayanRed hover:text-white"
                        : "text-gray-400 hover:bg-himalayanRed hover:text-white"
                    }`}
                    aria-label="List View"
                  >
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {isFilterActive && (
              <div className="flex items-center flex-wrap gap-2 pb-2 border-b border-gray-700 px-4 sm:px-0">
                <span className="text-gray-400 text-xs sm:text-sm mr-2">
                  Active Filters:
                </span>
                {selectedCategories.map((id, index) => (
                  <div
                    key={id}
                    className="flex items-center whitespace-nowrap px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-himalayanRed text-white border border-[#D4AF37] shadow-sm"
                  >
                    {selectedCategoryNames[index] || "Category"}
                    <button
                      className="ml-1.5 focus:outline-none hover:text-gray-200 transition-colors duration-200"
                      onClick={() => removeCategoryFilter(id)}
                      aria-label={`Remove category filter: ${selectedCategoryNames[index]}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedSubcategories.map((id, index) => (
                  <div
                    key={id}
                    className="flex items-center whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full bg-sacredMaroon text-white border border-[#F5F5DC] shadow-sm"
                  >
                    {selectedSubcategoryNames[index] || "Subcategory"}
                    <button
                      className="ml-1.5 focus:outline-none hover:text-gray-200 transition-colors duration-200"
                      onClick={() => removeSubcategoryFilter(id)}
                      aria-label={`Remove subcategory filter: ${selectedSubcategoryNames[index]}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {showInStockOnly && (
                  <div className="flex items-center whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full bg-brassGold text-dark border border-[#F5F5DC] shadow-sm">
                    In Stock
                    <button
                      className="ml-1.5 focus:outline-none hover:text-gray-200 transition-colors duration-200"
                      onClick={() => setShowInStockOnly(false)}
                      aria-label="Remove in stock filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {isPriceFilterActive &&
                  (priceRange[0] > minMaxPrice.min ||
                    priceRange[1] < minMaxPrice.max) && (
                    <div className="flex items-center whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full bg-green-600 text-white border border-[#D4AF37] shadow-sm">
                      Price: ${priceRange[0]} - ${priceRange[1]}
                      <button
                        className="ml-1.5 focus:outline-none hover:text-gray-200 transition-colors duration-200"
                        onClick={() => {
                          setPriceRange([minMaxPrice.min, minMaxPrice.max]);
                          setMinPrice(minMaxPrice.min.toString());
                          setMaxPrice(minMaxPrice.max.toString());
                          setIsPriceFilterActive(false);
                        }}
                        aria-label="Remove price filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                {searchQuery && (
                  <div className="flex items-center whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full bg-red-600 text-white border border-red-500 shadow-sm">
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      className="ml-1.5 focus:outline-none hover:text-gray-200 transition-colors duration-200"
                      onClick={() => setSearchQuery("")}
                      aria-label={`Remove search query: ${searchQuery}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-full px-3 py-1 transition-colors duration-200"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 px-4 sm:px-0">
            {/* Filters - Desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-250px)] sticky top-32 pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <FilterSidebar />
            </div>

            {/* Products Grid/List */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-12 sm:py-20">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brassGold"></div>
                  <p className="ml-4 text-gray-400 text-base sm:text-lg">
                    Loading products...
                  </p>
                </div>
              ) : sortedProducts.length > 0 ? (
                <div
                  className={`${
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 auto-rows-fr"
                      : "space-y-4 sm:space-y-6"
                  }`}
                >
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        stock: product.stock,
                        description: product.description,
                        sizes: product.sizes,
                        designs: product.designs?.map((design) => ({
                          title: design,
                          price: 0,
                          image: "",
                        })),
                        slug: product.slug,
                      }}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-20 text-gray-500 text-base sm:text-lg italic">
                  No products match your current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
