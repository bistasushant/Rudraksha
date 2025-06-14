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
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ArrowUpDown,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
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
import { ISize } from "@/types";
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
import { useDebounce } from "@/hooks/useDebounce";
import SizeListSkeleton from "./SizeListSkeleton";
import { Badge } from "@/components/ui/badge";

const SizeList = () => {
  const [sizeSearchTerm, setSizeSearchTerm] = useState<string>("");
  const debouncedSizeSearchTerm = useDebounce(sizeSearchTerm, 1000);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sizeData, setSizeData] = useState<ISize[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const router = useRouter();
  const { admin } = useAuth();
  const searchParams = useSearchParams();


  const canAddSize = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditSize = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteSize = admin?.role === "admin";
  const showActionsColumn = canEditSize || canDeleteSize;

  const fetchSizes = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view sizes.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/size?page=${currentPage}&limit=${itemsPerPage}`,
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
        throw new Error(errorData.message ?? "Failed to fetch sizes");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.message);
      }

      // Set the designs data from the response
      setSizeData(result.data?.productSizes ?? result.productSizes ?? []);
      
      const totalPagesFromResponse = result.data?.totalPages ?? result.totalPages ?? 1;
      setTotalPages(totalPagesFromResponse);
      setCurrentPage(result.data?.currentPage ?? result.page ?? currentPage);
    } catch (error) {
      console.error("Error fetching sizes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load sizes", {
        description: "Please try refreshing the page",
      });
    } finally {
      setLoading(false);
    }
  }, [admin, router, currentPage]);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      fetchSizes();
      router.replace("/admin/dashboard/size");
    }
  }, [searchParams, fetchSizes, router]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async () => {
    if (!selectedSizeId || !admin?.token || !canDeleteSize) {
      toast.error("You do not have permission to delete sizes.");
      setSelectedSizeId(null);
      return;
    }

    try {
      const response = await fetch(`/api/size/${selectedSizeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message ?? "Failed to delete size");
      }

      toast.success("Size deleted successfully!");
      setSelectedSizeId(null);
      await fetchSizes();
    } catch (error) {
      console.error("Error deleting size:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete size", {
        description: "Please try again",
      });
    }
  };

  const filteredSizes = sizeData.filter((size) => {
    if (!size) return false;

    const sizeMatch = size.size?.toLowerCase().includes(debouncedSizeSearchTerm.toLowerCase()) || false;
    const matchesSearch = debouncedSizeSearchTerm === "" || sizeMatch;
    
    if (filter === "Active" && size.isActive === false) return false;
    if (filter === "Inactive" && size.isActive === true) return false;
   
    return matchesSearch;

  });

  const sortedSizes = filteredSizes.toSorted((a, b) => {
    if (sortBy === "size") {
      return sortOrder === "asc" ? a.size.localeCompare(b.size) : b.size.localeCompare(a.size);
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const handleEdit = (id: string) => {
    if (!canEditSize) {
      toast.error("You do not have permission to edit sizes.");
      return;
    }
    router.push(`/admin/dashboard/size/edit/${id}`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search Designs..."
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={sizeSearchTerm}
              onChange={(e) => setSizeSearchTerm(e.target.value)}
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
        {canAddSize && (
          <Button
            onClick={() => router.push("/admin/dashboard/size/add")}
            className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
          >
            <Plus size={16} />
            <span className="font-normal">Add Size</span>
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Product Size Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">ID</TableHead>
                  <TableHead className="text-white/70 text-md">Name</TableHead>
                  <TableHead className="text-white/70 text-md">Status</TableHead>
                  <TableHead className="text-white/70 text-md">Created</TableHead>
                  {showActionsColumn && (
                    <TableHead className="text-white/70 text-md">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <SizeListSkeleton itemsPerPage={itemsPerPage} showActionsColumn={showActionsColumn} />
                ) : sortedSizes.length > 0 ? (
                  sortedSizes.map((size, index) => (
                    <TableRow
                      key={size.id?.toString()}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white/70 text-md">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                     
                  
                      <TableCell className="text-white/70 text-md font-medium">
                        {size.size}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${size.isActive
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            }`}
                        >
                          {size.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {size.createdAt
                          ? new Date(size.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEditSize && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-400/20"
                                onClick={() => handleEdit(size.id?.toString() || '')}
                              >
                                <Pencil className="w-4 h-4 text-emerald-400" />
                              </Button>
                            )}
                            {canDeleteSize && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-gray-400/20"
                                    onClick={() => setSelectedSizeId(size.id?.toString() || '')}
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950/90">
                                  <AlertDialogHeader className="text-white">
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/80">
                                      Are you sure you want to delete this size{" "}
                                      {size.size || "this size"}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedSizeId(null)}>
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
                  <TableRow key="no-sizes">
                    <TableCell
                      colSpan={showActionsColumn ? 6 : 10}
                      className="text-center text-white/70"
                    >
                      No size found
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
    </div>
  );
};

export default SizeList;