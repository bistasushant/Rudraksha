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
import { ISubCategory, ICategory } from "@/types";
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
import { useDebounce } from "@/hooks/useDebounce";


const SubCategoryPage = () => {
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState<string>("");
  const debouncedSubCategorySearchTerm = useDebounce(subCategorySearchTerm, 1000);
  const [filter, setFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [subCategoriesData, setSubCategoriesData] = useState<ISubCategory[]>(
    []
  );
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  const fetchSubcategories = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view subcategories.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const subCategoryResponse = await fetch(
        `/api/subcategory?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!subCategoryResponse.ok) {
        const errorData = await subCategoryResponse.json();
        throw new Error(errorData.message || "Failed to fetch subcategories");
      }

      const subCategoryResult = await subCategoryResponse.json();
      if (subCategoryResult.error) {
        throw new Error(subCategoryResult.message);
      }

      // Extract subcategories from data.categories
      const subCategories = Array.isArray(subCategoryResult.data?.categories)
        ? subCategoryResult.data.categories
        : [];
      setSubCategoriesData(subCategories);

      // Set pagination data if provided, otherwise calculate
      setCurrentPage(subCategoryResult.data?.page || 1);
      setTotalPages(
        subCategoryResult.data?.totalPages ||
        Math.ceil(subCategories.length / itemsPerPage)
      );
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load subcategories.",
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
      toast.error("Please log in to view subcategories.");
      router.push("/admin");
      return;
    }

    try {
      await fetchSubcategories();

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
      setCategories(
        Array.isArray(categoriesResult.data?.categories)
          ? categoriesResult.data.categories
          : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
    }
  }, [admin, router, fetchSubcategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryNames = (categoryIds: Types.ObjectId[] | string[]) => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return "No Category";
    }

    const names = categoryIds
      .map((categoryId) => {
        const id = categoryId.toString();
        const category = categories.find((cat) => cat.id?.toString() === id);
        return category ? category.name : "Unknown Category";
      })
      .filter((name) => name !== "Unknown Category");

    return names.length > 0 ? names.join(", ") : "No Category";
  };

  const filteredCategories = subCategoriesData.filter((subcategory) => {
    if (!subcategory) return false;

    const nameMatch =
      subcategory.name?.toLowerCase().includes(debouncedSubCategorySearchTerm.toLowerCase()) ||
      false;
    const slugMatch =
      subcategory.slug?.toLowerCase().includes(debouncedSubCategorySearchTerm.toLowerCase()) ||
      false;
    const seoTitleMatch =
      subcategory.seoTitle?.toLowerCase().includes(debouncedSubCategorySearchTerm.toLowerCase()) ||
      false;
    const metaDescriptionMatch =
      subcategory.metaDescription
        ?.toLowerCase()
        .includes(debouncedSubCategorySearchTerm.toLowerCase()) || false;
    const metaKeywordsMatch =
      subcategory.metaKeywords
        ?.toLowerCase()
        .includes(debouncedSubCategorySearchTerm.toLowerCase()) || false;
    const matchesSearch =
      debouncedSubCategorySearchTerm === "" ||
      nameMatch ||
      slugMatch ||
      seoTitleMatch ||
      metaDescriptionMatch ||
      metaKeywordsMatch;

    if (filter === "Active" && subcategory.isActive === false) return false;
    if (filter === "Inactive" && subcategory.isActive === true) return false;

    return matchesSearch;
  });

  const handleEdit = (slug: string) => {
    if (!admin?.role || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit subcategory.");
      return;
    }
    router.push(`/admin/dashboard/subcategory/edit/${slug}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (subcategory: {
    id: string;
    slug: string;
    name: string;
  }) => {
    if (!admin?.role || admin.role !== "admin") {
      toast.error("You do not have permission to delete subcategory.");
      return;
    }
    setSelectedSubCategory(subcategory);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSubCategory || !admin?.token || admin.role !== "admin") {
      toast.error("You do not have permission to delete subcategory.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/subcategory/${selectedSubCategory.slug}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete subcategory");
      }

      toast.success("Subcategory deleted successfully");
      fetchSubcategories();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete subcategory",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSubCategory(null);
    }
  };

  const sortedCategories = filteredCategories.sort((a, b) =>
    sortOrder === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );

  const canAddSubCategory =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditSubCategory =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteSubCategory = admin?.role === "admin";
  const showActionsColumn = canEditSubCategory || canDeleteSubCategory;

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32 bg-white/10" />
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

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 text-white/50" />
              <Input
                type="text"
                placeholder="Search Subcategories..."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={subCategorySearchTerm}
                onChange={(e) => setSubCategorySearchTerm(e.target.value)}
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
                <DropdownMenuItem onClick={() => setFilter("Active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Inactive")}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <span className="font-normal">Sort by Name</span>
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  A → Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  Z → A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canAddSubCategory && (
            <Button
              onClick={() => router.push("/admin/dashboard/subcategory/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add Subcategory</span>
            </Button>
          )}
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Subcategory Listing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">ID</TableHead>
                    <TableHead className="text-white/70 text-md">
                      Name
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Slug
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Category
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
                  {loading ? (
                    renderSkeletonRows()
                  ) : sortedCategories.length > 0 ? (
                    sortedCategories.map((subcategory, index) => (
                      <TableRow
                        key={subcategory.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="text-white/70 text-md">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {subcategory.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {subcategory.slug || "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {getCategoryNames(subcategory.category)
                            ? getCategoryNames(subcategory.category).length > 20
                              ? `${getCategoryNames(
                                subcategory.category
                              ).substring(0, 20)}...`
                              : getCategoryNames(subcategory.category)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {subcategory.seoTitle || "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {subcategory.metaDescription
                            ? subcategory.metaDescription.length > 20
                              ? `${subcategory.metaDescription.substring(
                                0,
                                20
                              )}...`
                              : subcategory.metaDescription
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {subcategory.metaKeywords
                            ? subcategory.metaKeywords.length > 20
                              ? `${subcategory.metaKeywords.substring(
                                0,
                                20
                              )}...`
                              : subcategory.metaKeywords
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${subcategory.isActive
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                              }`}
                          >
                            {subcategory.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {showActionsColumn && (
                          <TableCell>
                            <div className="flex gap-2">
                              {canEditSubCategory && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    subcategory.slug &&
                                    handleEdit(subcategory.slug)
                                  }
                                >
                                  <span className="text-blue-500">
                                    <Pencil />
                                  </span>
                                </Button>
                              )}
                              {canDeleteSubCategory && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    subcategory.id &&
                                    subcategory.slug &&
                                    openDeleteDialog({
                                      id: subcategory.id,
                                      slug: subcategory.slug,
                                      name: subcategory.name,
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={showActionsColumn ? 9 : 8}
                        className="text-center text-white/70"
                      >
                        No subcategory found.
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
              Delete Subcategory
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete the subcategory{" "}
              <strong>{selectedSubCategory?.name || "this subcategory"}</strong>
              ?
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

export default SubCategoryPage;
