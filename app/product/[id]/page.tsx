"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, Award, Shield, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HTMLContent from "@/components/HTMLContent";
import BlogHighlights from "@/components/sections/BlogHighlights";
import PackageInfo from "@/components/sections/PackageInfo";
import { useCart } from "@/context/cart-context";
import type { CartItem } from "@/context/cart-context";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  rating: number;
  stock: number;
  category: string | string[];
  subcategory?: string | string[];
  benefit?: string;
  benefits?: string[];
  image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
  sizes?: Array<{ size?: string; sizeId?: string; price: number }>;
  designs?: Design[];
}

interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}

interface ProductListData {
  products: Product[];
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface CategoryListData {
  categories: Category[];
}

interface SubcategoryListData {
  categories: Subcategory[];
}

interface LensPosState {
  x: number;
  y: number;
  bgX: number;
  bgY: number;
  imgRectWidth?: number;
  imgRectHeight?: number;
}

interface Design {
  _id: string;
  productId: string;
  productName: string;
  title: string;
  image: string;
  price: number;
}

interface Size {
  id: string;
  size: string;
  price: number;
}

interface PackageInfoData {
  id: string;
  type: "package";
  title: string;
  description: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { addItem } = useCart();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [subcategoryNames, setSubcategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>();
  const [packageInfo, setPackageInfo] = useState<PackageInfoData | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState<LensPosState>({
    x: 0,
    y: 0,
    bgX: 0,
    bgY: 0,
  });
  const zoom = 3;
  const lensSize = 120;

  // Handle mouse movement for zoom lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !mainImage || rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const boundedX = Math.max(0, Math.min(x, rect.width));
    const boundedY = Math.max(0, Math.min(y, rect.height));
    const bgPosX = -(boundedX * zoom - lensSize / 2);
    const bgPosY = -(boundedY * zoom - lensSize / 2);

    setLensPos({
      x,
      y,
      bgX: bgPosX,
      bgY: bgPosY,
      imgRectWidth: rect.width,
      imgRectHeight: rect.height,
    });
  };

  // Fetch product and related data
  useEffect(() => {
    const fetchProductAndCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const [productResponse, packageResponse, sizesResponse] =
          await Promise.all([
            fetch(`/api/products`),
            fetch("/api/content?type=package"),
            fetch("/api/size"),
          ]);

        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(errorData.message || "Failed to fetch products");
        }

        const productData: ApiResponse<ProductListData> =
          await productResponse.json();
        const allProducts = productData.data.products;
        const fetchedProduct = allProducts.find(
          (p: Product) => p.id === id || p.slug === id
        );

        if (!fetchedProduct) {
          throw new Error(`Product with id ${id} not found`);
        }

        // Handle sizes data
        if (sizesResponse.ok) {
          const sizesData = await sizesResponse.json();
          if (!sizesData.error && sizesData.data?.productSizes) {
            const sizeMap: Map<string, string> = new Map(
              sizesData.data.productSizes.map(
                (size: { id: string; size: string }) => [size.id, size.size]
              )
            );

            if (fetchedProduct.sizes) {
              const updatedSizes = fetchedProduct.sizes.map((size) => {
                const sizeName = size.sizeId
                  ? sizeMap.get(size.sizeId)
                  : "Small";
                return {
                  sizeId: size.sizeId,
                  size: typeof sizeName === "string" ? sizeName : "Small",
                  price: size.price,
                };
              });
              fetchedProduct.sizes = updatedSizes;

              // Set initial selected size to Small
              const smallSize = updatedSizes.find((size) => !size.sizeId);
              if (smallSize) {
                setSelectedSize({
                  id: "small",
                  size: "Small",
                  price: smallSize.price,
                });
              }
            }
          }
        }

        setProduct(fetchedProduct);

        // Handle package response
        if (packageResponse.ok) {
          const packageData = await packageResponse.json();
          if (
            !packageData.error &&
            packageData.data &&
            packageData.data.length > 0
          ) {
            const packageInfoData = packageData.data[0];
            // Ensure the data matches the required interface
            if (packageInfoData.type === "package" && packageInfoData.title && packageInfoData.description) {
              setPackageInfo({
                id: packageInfoData.id || packageInfoData._id || "",
                type: "package",
                title: packageInfoData.title,
                description: packageInfoData.description,
                image: packageInfoData.image,
                createdAt: packageInfoData.createdAt,
                updatedAt: packageInfoData.updatedAt
              });
            }
          }
        }

        // Fetch categories
        const categoryResponse = await fetch(`/api/category`);
        if (!categoryResponse.ok) {
          const errorData = await categoryResponse.json();
          throw new Error(errorData.message || "Failed to fetch categories");
        }

        const categoryData: ApiResponse<CategoryListData> =
          await categoryResponse.json();
        const categories = categoryData.data?.categories || [];
        const categoryMap: { [key: string]: string } = {};
        categories.forEach((category: Category) => {
          categoryMap[category.id] = category.name;
        });

        const categoryIds = Array.isArray(fetchedProduct.category)
          ? fetchedProduct.category
          : fetchedProduct.category
          ? [fetchedProduct.category]
          : [];
        const resolvedCategoryNames = categoryIds.map(
          (catId) => categoryMap[catId] || `Unknown Category (${catId})`
        );
        setCategoryNames(resolvedCategoryNames);

        // Fetch subcategories
        const subcategoryResponse = await fetch(`/api/subcategory`);
        if (!subcategoryResponse.ok) {
          const errorData = await subcategoryResponse.json();
          throw new Error(errorData.message || "Failed to fetch subcategories");
        }

        const subcategoryData: ApiResponse<SubcategoryListData> =
          await subcategoryResponse.json();
        const subcategories = subcategoryData.data?.categories || [];
        const subcategoryMap: { [key: string]: string } = {};
        subcategories.forEach((subcategory: Subcategory) => {
          subcategoryMap[subcategory.id] = subcategory.name;
        });

        const subcategoryIds = Array.isArray(fetchedProduct.subcategory)
          ? fetchedProduct.subcategory
          : fetchedProduct.subcategory
          ? [fetchedProduct.subcategory]
          : [];
        const resolvedSubcategoryNames = subcategoryIds.map(
          (subId) => subcategoryMap[subId] || `Unknown Subcategory (${subId})`
        );
        setSubcategoryNames(resolvedSubcategoryNames);

        const primaryImage =
          fetchedProduct.images?.[0] ||
          fetchedProduct.image ||
          "/images/default-image.png";
        setMainImage(primaryImage);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching product details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductAndCategories();
    } else {
      setError("Product ID is missing.");
      setLoading(false);
    }
  }, [id]);

  // Update current price based on selections
  useEffect(() => {
    if (product) {
      let price = product.salePrice ?? product.price;
      if (selectedSize) {
        price += selectedSize.price;
      }
      if (selectedDesign) {
        price += selectedDesign.price;
      }
      setCurrentPrice(price);
    }
  }, [product, selectedSize, selectedDesign]);

  // Handle thumbnail click
  const handleThumbnailClick = (imageSrc: string) => {
    setMainImage(imageSrc);
  };

  // Handle size selection
  const handleSizeSelect = (size: {
    size?: string;
    sizeId?: string;
    price: number;
  }) => {
    const sizeId = size.sizeId || "small";
    const sizeName = size.size || "Small";

    if (selectedSize?.id === sizeId) {
      setSelectedSize(null);
    } else {
      setSelectedSize({
        id: sizeId,
        size: sizeName,
        price: size.price,
      });
    }
  };

  // Handle design selection
  const handleDesignSelect = (design: Design) => {
    if (selectedDesign?.title === design.title) {
      setSelectedDesign(null);
    } else {
      setSelectedDesign(design);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: currentPrice,
        image: mainImage || "/images/default-image.png",
        quantity: 1,
        size: selectedSize
          ? {
              size: selectedSize.size,
              price: selectedSize.price,
              sizeId: selectedSize.id === "small" ? undefined : selectedSize.id
            }
          : undefined,
        design: selectedDesign
          ? {
              title: selectedDesign.title,
              price: selectedDesign.price,
              image: selectedDesign.image
            }
          : undefined,
      };

      console.log("Attempting to add item to cart:", cartItem);
      await addItem(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add to cart";
      toast.error("Failed to add to cart", {
        description: errorMessage,
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] flex justify-center items-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-[#D4AF37]/50 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] flex justify-center items-center">
        <div className="text-center p-8 bg-red-900/20 backdrop-blur-lg rounded-2xl border border-red-500/30">
          <h1 className="text-3xl font-bold mb-4 text-red-400">
            Error Loading Product
          </h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  // Product not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] flex justify-center items-center">
        <div className="text-center p-8 bg-gray-900/40 backdrop-blur-lg rounded-2xl border border-gray-600/30">
          <h1 className="text-3xl font-bold mb-4 text-ivoryWhite">
            Product Not Found
          </h1>
          <p className="text-gray-400">
            Sorry, we could not find the product with ID: {id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-ping"></div>
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-32 pb-16">
            <div className="space-y-8">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-purple-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div
                  ref={containerRef}
                  className="relative aspect-square rounded-3xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10 shadow-2xl"
                  onMouseEnter={() => setShowLens(true)}
                  onMouseLeave={() => setShowLens(false)}
                  onMouseMove={handleMouseMove}
                  style={{ cursor: "crosshair" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 via-transparent to-blue-500/5"></div>
                  <Image
                    src={mainImage || "/images/default-image.png"}
                    alt={product.name}
                    fill
                    className="w-full h-full object-cover select-none"
                    onError={() => setMainImage("/images/default-image.png")}
                    priority
                    draggable={false}
                  />
                  {showLens &&
                    mainImage &&
                    lensPos.imgRectWidth &&
                    lensPos.imgRectHeight && (
                      <div
                        className="absolute rounded-full border-3 border-white shadow-2xl pointer-events-none overflow-hidden"
                        style={{
                          width: `${lensSize}px`,
                          height: `${lensSize}px`,
                          top: lensPos.y - lensSize / 2,
                          left: lensPos.x - lensSize / 2,
                          backgroundImage: `url(${mainImage})`,
                          backgroundRepeat: "no-repeat",
                          backgroundSize: `${lensPos.imgRectWidth * zoom}px ${
                            lensPos.imgRectHeight * zoom
                          }px`,
                          backgroundPosition: `${lensPos.bgX}px ${lensPos.bgY}px`,
                          zIndex: 20,
                          boxShadow:
                            "0 0 20px rgba(212, 175, 55, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)",
                        }}
                      />
                    )}
                </div>
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <div
                      key={`thumbnail-${product.id}-${index}`}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 ${
                        mainImage === image
                          ? "ring-2 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/25"
                          : "ring-1 ring-white/20 hover:ring-white/40"
                      }`}
                      onClick={() => handleThumbnailClick(image)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                      <Image
                        src={image}
                        alt={`${product.name} - thumbnail ${index + 1}`}
                        fill
                        className="object-contain"
                        onError={(e) =>
                          (e.currentTarget.src = "/images/default-image.png")
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-8">
              {(categoryNames.length > 0 || subcategoryNames.length > 0) && (
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-[#D4AF37]/20 backdrop-blur-sm rounded-full text-sm text-[#D4AF37] border border-[#D4AF37]/30 font-medium">
                    {categoryNames.join(", ")}
                  </span>
                  {subcategoryNames.length > 0 && (
                    <>
                      <span className="w-0.5 h-8 bg-gradient-to-b from-[#D4AF27] via-yellow-500 to-[#1C1C1C] rounded-full" />
                      <span className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-sm text-blue-300 border border-blue-500/30 font-medium">
                        {subcategoryNames.join(", ")}
                      </span>
                    </>
                  )}
                </div>
              )}
              <h1 className="text-4xl lg:text-5xl font-bold text-ivoryWhite leading-tight relative group">
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                  {product.name}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37]/20 to-[#D4AF37]/40 blur-xl -z-10 transition-all duration-500 group-hover:blur-2xl group-hover:opacity-70"></div>
                <div className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </h1>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-ivoryWhite flex items-center gap-2">
                  <div className="w-1 h-6 bg-brassGold rounded-full"></div>
                  Description
                </h2>
                <div className="product-description leading-relaxed text-white backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/[0.02] p-8 rounded-2xl border border-white/10 text-justify shadow-lg shadow-[#B87333]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#B87333]/30 hover:border-white/20 [&_*]:text-ivoryWhite [&_u]:underline [&_u]:decoration-2 [&_u]:decoration-brassGold">
                  {product.description ? (
                    <HTMLContent html={product.description} />
                  ) : (
                    <p className="italic text-ivoryWhite">
                      No description available.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-6 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/20 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl hover:shadow-[#D4AF37]/30 hover:border-[#D4AF37]/20">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Base Price:</span>
                    <span className="text-ivoryWhite">
                      Rs {(product.salePrice ?? product.price).toFixed(2)}
                    </span>
                  </div>
                  {selectedSize && selectedSize.id !== "small" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">
                        + Size ({selectedSize.size}):
                      </span>
                      <span className="text-[#D4AF37]">
                        Rs {selectedSize.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedDesign && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">
                        + Design ({selectedDesign.title}):
                      </span>
                      <span className="text-[#D4AF37]">
                        Rs {selectedDesign.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 uppercase tracking-wider">
                      Total Price
                    </span>
                    <span
                      className={`text-4xl font-bold ${
                        product.salePrice ? "text-green-400" : "text-brassGold"
                      }`}
                    >
                      Rs {currentPrice.toFixed(2)}
                    </span>
                  </div>
                  {product.salePrice && (
                    <span className="text-xl text-gray-400 line-through">
                      Rs {product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-ivoryWhite flex items-center gap-2">
                    <div className="w-1 h-6 bg-brassGold rounded-full"></div>
                    Select Your Size
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size, index) => {
                      const sizeId = size.sizeId || "small";
                      const sizeName = size.size || "Small";
                      const isSelected = selectedSize?.id === sizeId;
                      return (
                        <button
                          key={`size-${product.id}-${sizeId}-${index}`}
                          onClick={() => handleSizeSelect(size)}
                          className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                            isSelected
                              ? "bg-[#D4AF37] text-charcoalBlack font-semibold shadow-lg shadow-[#D4AF37]/30"
                              : "bg-white/5 text-ivoryWhite hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          <span>{sizeName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {product.designs && product.designs.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-ivoryWhite flex items-center gap-2">
                    <div className="w-1 h-6 bg-brassGold rounded-full"></div>
                    Select Your Design
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {product.designs.map((design) => (
                      <div
                        key={`design-${product.id}-${design._id}`}
                        onClick={() => handleDesignSelect(design)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                          selectedDesign?.title === design.title
                            ? "border-[#D4AF37] shadow-lg shadow-[#D4AF37]/25"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={design.image}
                            alt={design.title}
                            fill
                            className="object-cover"
                          />
                          {selectedDesign?.title === design.title && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Check className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                          <h3 className="text-white text-xs font-medium truncate">
                            {design.title}
                          </h3>
                          <p className="text-[#D4AF37] text-[10px]">
                            + Rs {design.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-ivoryWhite">Stock</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      product.stock > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} available`
                      : "Out of Stock"}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-brassGold" />
                  <h2 className="text-2xl font-bold text-ivoryWhite">
                    Key Benefits
                  </h2>
                </div>
                <div className="p-6 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-blue-500/5 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:border-white/20 [&_*]:text-ivoryWhite [&_ul]:list-disc [&_ul]:pl-5 [&_li]:before:content-['•'] [&_li]:before:text-ivoryWhite [&_li]:before:mr-2">
                  {product.benefits && product.benefits.length > 0 ? (
                    <div className="space-y-3">
                      {product.benefits.map((benefit, index) => (
                        <div
                          key={`benefit-${product.id}-${index}`}
                          className="flex items-start gap-3"
                        >
                          <div className="w-2 h-2 bg-ivoryWhite rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-ivoryWhite text-justify">
                            <HTMLContent html={benefit} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : product.benefit ? (
                    <div className="text-ivoryWhite text-justify">
                      <HTMLContent html={product.benefit} />
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-justify">
                      No benefits information available.
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="group relative w-full h-14 bg-gradient-to-r from-[#D4AF37] via-yellow-500 to-[#D4AF37] text-charcoalBlack font-bold text-lg rounded-2xl border-2 border-[#D4AF37]/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#D4AF37]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <ShoppingCart className="w-6 h-6" />
                    <span>
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </span>
                  </div>
                </Button>
              </div>
              <div className="flex justify-center gap-8 pt-6 opacity-60">
                <div className="text-center">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Secure Payment</p>
                </div>
                <div className="text-center">
                  <Award className="w-8 h-8 text-brassGold mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Authentic Products</p>
                </div>
                <div className="text-center">
                  <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PackageInfo packageInfo={packageInfo} />
        <BlogHighlights />
      </div>
      <Footer />
    </>
  );
}