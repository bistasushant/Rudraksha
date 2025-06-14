"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { IProduct, ICategory } from "@/types";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Types } from "mongoose";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import parse from "html-react-parser";
import { useDebounce } from "@/hooks/useDebounce";


const ProductsPage = () => {
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 1000);

  const [filter, setFilter] = useState<
    "All" | "In Stock" | "Out of Stock" | "On Sale"
  >("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [productsData, setProductsData] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [subcategories, setSubcategories] = useState<ICategory[]>([]);
  const [sizes, setSizes] = useState<{ _id: string; id?: string; size: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "NPR" | "">("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  // Conversion rate (1 USD = 135 NPR, replace with API if needed)
  const CONVERSION_RATE_USD_TO_NPR = 135;

  const fetchCurrency = useCallback(async () => {
    if (!admin?.token) {
      return;
    }
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
  }, [admin]);

  const fetchProducts = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view products.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const productsResponse = await fetch(
        `/api/products?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!productsResponse.ok) {
        const errorData = await productsResponse.json();
        throw new Error(errorData.message || "Failed to fetch products");
      }

      const productsResult = await productsResponse.json();
      if (productsResult.error) {
        throw new Error(productsResult.message);
      }

      setProductsData(productsResult.data?.products || []);
      setCurrentPage(productsResult.data?.page || 1);
      setTotalPages(productsResult.data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load products.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, router, itemsPerPage]);

  const fetchData = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view products.");
      router.push("/admin");
      return;
    }

    try {
      await Promise.all([fetchProducts(), fetchCurrency()]);

      // Fetch categories
      const categoriesResponse = await fetch("/api/category", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
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
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      });

      if (!subcategoriesResponse.ok) {
        const errorData = await subcategoriesResponse.json();
        console.error("Error fetching subcategories:", errorData);
        throw new Error(errorData.message || "Failed to fetch subcategories");
      }

      const subcategoriesResult = await subcategoriesResponse.json();
      setSubcategories(subcategoriesResult.data?.categories || []);

      // Fetch sizes
      const sizesResponse = await fetch("/api/size", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      });

      if (!sizesResponse.ok) {
        const errorData = await sizesResponse.json();
        throw new Error(errorData.message || "Failed to fetch sizes");
      }

      const sizesResult = await sizesResponse.json();
      console.log("Sizes API response:", sizesResult); // Debug log
      if (sizesResult.data && sizesResult.data.productSizes) {
        setSizes(sizesResult.data.productSizes);
      } else if (sizesResult.data && sizesResult.data.sizes) {
        setSizes(sizesResult.data.sizes);
      } else if (sizesResult.productSizes) {
        setSizes(sizesResult.productSizes);
      } else {
        console.warn("Sizes data not found in expected format:", sizesResult);
        setSizes([]);
      }
      setSizes(sizesResult.data?.productSizes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
    }
  }, [admin, router, fetchProducts, fetchCurrency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to format price based on currency
  const formatPrice = (price: number) => {
    if (currency === "USD") {
      const usdPrice = price / CONVERSION_RATE_USD_TO_NPR;
      return `$ ${usdPrice.toFixed(2)}`;
    }
    return `Rs ${price.toFixed(2)}`;
  };

  // Function to get category names by IDs
  const getCategoryNames = (categoryIds: Types.ObjectId[] | string[]) => {
    if (!Array.isArray(categoryIds)) {
      return "Unknown Category";
    }

    return categoryIds
      .map((categoryId) => {
        const id = categoryId.toString();
        const category = categories.find((cat) => cat.id === id);
        return category ? category.name : "Unknown Category";
      })
      .join(", ");
  };

  const getSubCategoryNames = (subcategoryIds: Types.ObjectId[] | string[]) => {
    if (!Array.isArray(subcategoryIds) || subcategoryIds.length === 0) {
      return "No Subcategories";
    }

    return (
      subcategoryIds
        .map((subcategoryId) => {
          const id = subcategoryId.toString();
          const subcategory = subcategories.find(
            (sub) => sub.id.toString() === id
          );
          return subcategory ? subcategory.name : null;
        })
        .filter((name) => name !== null)
        .join(", ") || "No Subcategories"
    );
  };
  const getSizeNames = (productSizes: { sizeId?: string | Types.ObjectId; size?: string; price: number }[] | undefined) => {
    if (!productSizes || !Array.isArray(productSizes) || productSizes.length === 0) {
      return "No Sizes";
    }
    
    return productSizes
      .map((productSize) => {
        if (!productSize) return null;
        
        // Handle both sizeId and size cases
        const sizeObj = sizes.find((s) => {
          if (productSize.sizeId) {
            return s._id?.toString() === productSize.sizeId.toString() || 
                   s.id?.toString() === productSize.sizeId.toString();
          }
          if (productSize.size) {
            return s.size === productSize.size;
          }
          return false;
        });
        
        return sizeObj ? `${sizeObj.size} (${formatPrice(productSize.price)})` : 
               productSize.size ? `${productSize.size} (${formatPrice(productSize.price)})` : 
               `Unknown Size (${formatPrice(productSize.price)})`;
      })
      .filter((size) => size !== null)
      .join(", ") || "No Sizes";
  };

  const getDesignNames = (designs: { title: string; price: number; image: string }[] | undefined) => {
    if (!designs || !Array.isArray(designs) || designs.length === 0) {
      return "No Designs";
    }
    return designs.map(design => `${design.title} (${formatPrice(design.price)})`).join(", ");
  };

  const filteredProducts = productsData.filter((product) => {
    const categoryNames = getCategoryNames(product.category);
    const subcategoryNames = getSubCategoryNames(product.subcategory);
    const matchesSearch =
      product.name.toLowerCase().includes(debouncedProductSearchTerm.toLowerCase()) ||
      categoryNames.toLowerCase().includes(debouncedProductSearchTerm.toLowerCase()) ||
      subcategoryNames.toLowerCase().includes(debouncedProductSearchTerm.toLowerCase());
    const matchesFilter =
      filter === "All" ||
      (filter === "In Stock" && product.stock > 0) ||
      (filter === "Out of Stock" && product.stock === 0) ||
      (filter === "On Sale" &&
        (currency === "USD"
          ? product.price / CONVERSION_RATE_USD_TO_NPR <
          500 / CONVERSION_RATE_USD_TO_NPR
          : product.price < 500));
    return matchesSearch && matchesFilter;
  });

  const sortedProducts = filteredProducts.sort((a, b) =>
    sortOrder === "asc" ? a.price - b.price : b.price - a.price
  );

  const handleEdit = (slug: string) => {
    if (!admin?.role || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit products.");
      return;
    }
    router.push(`/admin/dashboard/products/edit/${slug}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (product: {
    id: string;
    slug: string;
    name: string;
  }) => {
    if (!admin?.role || admin.role !== "admin") {
      toast.error("You do not have permission to delete products.");
      return;
    }
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct || !admin?.token || admin.role !== "admin") {
      toast.error("You do not have permission to delete products.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/${selectedProduct.slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }

      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const canAddProduct = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditProduct =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteProduct = admin?.role === "admin";
  const showActionsColumn = canEditProduct || canDeleteProduct;

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48 bg-white/10" />
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 bg-white/10" />
              <Skeleton className="h-8 w-8 bg-white/10" />
            </div>
          </TableCell>
        )}
      </TableRow>
    ));

  const renderTableContent = () => {
    if (loading) {
      return renderSkeletonRows();
    }
    
    if (sortedProducts.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={showActionsColumn ? 17 : 13}
            className="text-center text-white/70"
          >
            No products found.
          </TableCell>
        </TableRow>
      );
    }

    return sortedProducts.map((product, index) => (
      <TableRow
        key={product.id}
        className="border-white/10 hover:bg-white/5"
      >
        <TableCell className="text-white/70 text-md">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {product.images?.map((imgUrl, imgIndex) => (
                <Avatar key={imgIndex} className="h-8 w-8">
                  <AvatarImage
                    src={imgUrl}
                    alt={`Product Image ${imgIndex + 1}`}
                  />
                  <AvatarFallback className="bg-purple-600">
                    P
                  </AvatarFallback>
                </Avatar>
              ))}
              {(!product.images ||
                product.images.length === 0) && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/images/placeholder.png"
                      alt="Product Image"
                    />
                    <AvatarFallback className="bg-purple-600">
                      P
                    </AvatarFallback>
                  </Avatar>
                )}
            </div>
            <span className="text-white/70 text-md">
              {product.name}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.slug}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.description ? (
            <div className="rich-text-content max-h-4 overflow-hidden">
              {parse(
                product.description.length > 20
                  ? product.description.substring(0, 20) + "..."
                  : product.description
              )}
            </div>
          ) : (
            "No description"
          )}
        </TableCell>
        <TableCell className="text-white/70 text-md max-w-[200px]">
          {product.benefit ? (
            <div className="rich-text-content max-h-4 overflow-hidden">
              {parse(product.benefit)}
            </div>
          ) : (
            "No benefit"
          )}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {getCategoryNames(product.category)
            ? getCategoryNames(product.category).length > 20
              ? `${getCategoryNames(product.category).substring(
                0,
                20
              )}...`
              : getCategoryNames(product.category)
            : "N/A"}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {getSubCategoryNames(product.subcategory)
            ? getSubCategoryNames(product.subcategory).length >
              20
              ? `${getSubCategoryNames(
                product.subcategory
              ).substring(0, 20)}...`
              : getSubCategoryNames(product.subcategory)
            : "N/A"}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {getSizeNames(product.sizes)?.length > 10
            ? `${getSizeNames(product.sizes).substring(0, 10)}...`
            : getSizeNames(product.sizes)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {getDesignNames(product.designs)?.length > 10
           ? `${getDesignNames(product.designs).substring(0, 10)}...`
          : getDesignNames(product.designs)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {formatPrice(product.price)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.stock}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.seoTitle}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.metaDescription
            ? product.metaDescription.length > 20
              ? `${product.metaDescription?.substring(
                0,
                20
              )}...`
              : product.metaDescription
            : ""}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {product.metaKeywords
            ? product.metaKeywords.length > 20
              ? `${product.metaKeywords?.substring(0, 20)}...`
              : product.metaKeywords
            : ""}
        </TableCell>
        <TableCell>
          <Badge
            className={`${
              product.feature
                ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            }`}
          >
            {product.feature ? "Feature" : "Regular"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            className={`${product.stock > 0
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
          >
            {product.stock > 0 ? "Available" : "Out of Stock"}
          </Badge>
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <div className="flex gap-2">
              {canEditProduct && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-400/20"
                  onClick={() =>
                    product.slug && handleEdit(product.slug)
                  }
                >
                  <span className="text-blue-500">
                    <Pencil />
                  </span>
                </Button>
              )}
              {canDeleteProduct && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-400/20"
                  onClick={() =>
                    product.id &&
                    product.slug &&
                    openDeleteDialog({
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                    })
                  }
                >
                  <span className="text-red-500">
                    <Trash2 />
                  </span>
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 text-white/50" />
              <Input
                type="text"
                placeholder="Search Products..."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <Filter size={16} />
                  <span className="font-normal">Filter</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setFilter("All")}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("In Stock")}>
                  In Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Out of Stock")}>
                  Out of Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("On Sale")}>
                  On Sale
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <span className="font-normal">Sort by Price</span>
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  Low to High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  High to Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canAddProduct && (
            <Button
              onClick={() => router.push("/admin/dashboard/products/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add Product</span>
            </Button>
          )}
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Product List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">
                      Product ID
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Product Name
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Slug
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Description
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Benefit
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Category
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Subcategory
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Size
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Design
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Price
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Stock
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      SEO Title
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Meta Description
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Meta Keywords
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Feature
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Status
                    </TableHead>
                    {showActionsColumn && (
                      <TableHead className="text-white/70 text-md">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableContent()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination className="mt-3">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === page
                        ? "bg-emerald-500/20 text-emerald-400"
                        : ""
                        }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                    }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this product{" "}
              <strong>{selectedProduct?.name || "this product"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsPage;
