"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ICategory } from "@/types";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import parse from "html-react-parser";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";

const CategoriesPage = () => {
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>("");
  const debouncedCategorySearchTerm = useDebounce(categorySearchTerm, 1000);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categoriesData, setCategoriesData] = useState<ICategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const router = useRouter();
  const { admin } = useAuth();
  const searchParams = useSearchParams();


  const canAddCategory = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditCategory = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteCategory = admin?.role === "admin";
  const showActionsColumn = canEditCategory || canDeleteCategory;

  const fetchCategories = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view categories.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/category?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch categories");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.message);
      }

      let categories = [];
      if (result.data?.categories) {
        categories = Array.isArray(result.data.categories) ? result.data.categories : [];
      } else if (Array.isArray(result.data)) {
        categories = result.data;
      } else if (result.categories) {
        categories = Array.isArray(result.categories) ? result.categories : [];
      }

      setCategoriesData(categories);
      const totalPagesFromResponse = result.data?.totalPages || result.totalPages || 1;
      setTotalPages(totalPagesFromResponse);
      setCurrentPage(result.data?.currentPage || result.page || currentPage);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load categories", {
        description: "Please try refreshing the page",
      });
    } finally {
      setLoading(false);
    }
  }, [admin, router, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      fetchCategories();
      router.replace("/admin/dashboard/category");
    }
  }, [searchParams, fetchCategories, router]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategorySlug || !admin?.token || !canDeleteCategory) {
      toast.error("You do not have permission to delete categories.");
      setSelectedCategorySlug(null);
      return;
    }

    try {
      const response = await fetch(`/api/category/${selectedCategorySlug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to delete category");
      }

      setCategoriesData((prev) => prev.filter((cat) => cat.slug !== selectedCategorySlug));
      toast.success("Category deleted successfully!");
      setSelectedCategorySlug(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete category", {
        description: "Please try again",
      });
    }
  };

  const filteredCategories = categoriesData.filter((category) => {
    if (!category) return false;

    const nameMatch = category.name?.toLowerCase().includes(debouncedCategorySearchTerm.toLowerCase()) || false;
    const slugMatch = category.slug?.toLowerCase().includes(debouncedCategorySearchTerm.toLowerCase()) || false;
    const seoTitleMatch = category.seoTitle?.toLowerCase().includes(debouncedCategorySearchTerm.toLowerCase()) || false;
    const metaDescriptionMatch = category.metaDescription?.toLowerCase().includes(debouncedCategorySearchTerm.toLowerCase()) || false;
    const metaKeywordsMatch = category.metaKeywords?.toLowerCase().includes(debouncedCategorySearchTerm.toLowerCase()) || false;
    const matchesSearch = debouncedCategorySearchTerm === "" || nameMatch || slugMatch || seoTitleMatch || metaDescriptionMatch || metaKeywordsMatch;

    if (filter === "Active" && category.isActive === false) return false;
    if (filter === "Inactive" && category.isActive === true) return false;

    return matchesSearch;
  });

  const sortedCategories = filteredCategories.sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
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

  const handleEdit = (slug: string) => {
    if (!canEditCategory) {
      toast.error("You do not have permission to edit categories.");
      return;
    }
    router.push(`/admin/dashboard/category/edit/${slug}`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search Categories..."
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
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
              <DropdownMenuItem onClick={() => setFilter("All")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("Active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("Inactive")}>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                <span className="font-normal">Sort by</span>
                <ArrowUpDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/90 text-white">
              <DropdownMenuItem onClick={() => { setSortBy("createdAt"); setSortOrder("desc"); }}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("createdAt"); setSortOrder("asc"); }}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("asc"); }}>
                Name A → Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("desc"); }}>
                Name Z → A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {canAddCategory && (
          <Button
            onClick={() => router.push("/admin/dashboard/category/add")}
            className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
          >
            <Plus size={16} />
            <span className="font-normal">Add Category</span>
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Category Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">ID</TableHead>
                  <TableHead className="text-white/70 text-md">Image</TableHead>
                  <TableHead className="text-white/70 text-md">Name</TableHead>
                  <TableHead className="text-white/70 text-md">Description</TableHead>
                  <TableHead className="text-white/70 text-md">Benefit</TableHead>
                  <TableHead className="text-white/70 text-md">Slug</TableHead>
                  <TableHead className="text-white/70 text-md">SEO Title</TableHead>
                  <TableHead className="text-white/70 text-md">Meta Description</TableHead>
                  <TableHead className="text-white/70 text-md">Meta Keywords</TableHead>
                  <TableHead className="text-white/70 text-md">Status</TableHead>
                  <TableHead className="text-white/70 text-md">Created</TableHead>
                  {showActionsColumn && (
                    <TableHead className="text-white/70 text-md">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  renderSkeletonRows()
                ) : sortedCategories.length > 0 ? (
                  sortedCategories.map((category, index) => (
                    <TableRow
                      key={category.id || category.slug}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white/70 text-md">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        <Image src={category.image} alt={category.name} width={20} height={10} className="rounded-full" />
                      </TableCell>
                      <TableCell className="text-white/70 text-md font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[100px]">
                        {category.description ? (
                          <div className="rich-text-content max-h-4 overflow-hidden">
                            {parse(category.description)}
                          </div>
                        ) : (
                          "No description"
                        )}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[100px]">
                        {category.benefit ? (
                          <div className="rich-text-content max-h-4 overflow-hidden">
                            {parse(category.benefit)}
                          </div>
                        ) : (
                          "No benefit"
                        )}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[200px] truncate">
                        {category.slug || "No slug"}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[200px] truncate">
                        {category.seoTitle || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[200px] truncate">
                        {category.metaDescription || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/70 text-md max-w-[200px] truncate">
                        {category.metaKeywords || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${category.isActive
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEditCategory && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-400/20"
                                onClick={() => handleEdit(category.slug)}
                              >
                                <Pencil className="w-4 h-4 text-emerald-400" />
                              </Button>
                            )}
                            {canDeleteCategory && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-gray-400/20"
                                    onClick={() => setSelectedCategorySlug(category.slug)}
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950/90">
                                  <AlertDialogHeader className="text-white">
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/80">
                                      Are you sure you want to delete this category{" "}
                                      {category.name || "this category"}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedCategorySlug(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDelete}
                                      className="bg-red-500 hover:bg-red-800"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow key="no-categories">
                    <TableCell
                      colSpan={showActionsColumn ? 12 : 10}
                      className="text-center text-white/70"
                    >
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="mt-3">
          <PaginationContent className="flex items-center gap-2">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => handlePageChange(currentPage - 1)}
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === page ? "bg-emerald-500/20 text-emerald-400" : ""
                    }`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => handlePageChange(currentPage + 1)}
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <style jsx global>{`
      .rich-text-content {
        line-height: 1.5;
      }
      .rich-text-content ul,
      .rich-text-content ol {
        margin-left: 1.5rem;
      }
      .rich-text-content ul {
        list-style-type: disc;
      }
      .rich-text-content ol {
        list-style-type: decimal;
      }
      .rich-text-content b,
      .rich-text-content strong {
        font-weight: bold;
      }
      .rich-text-content i,
      .rich-text-content em {
        font-style: italic;
      }
      .rich-text-content img {
        max-width: 100%;
        height: auto;
      }
      /* Remove unwanted dots between pagination items */
      .pagination > * + *::before {
        content: none !important;
      }
      .pagination li::marker {
        content: none !important;
      }
    `}</style>
    </div>
  );
};

export default CategoriesPage;