"use client";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
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
import { IBenefit } from "@/types";
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
import BenefitSkeleton from "./BenefitSkeleton";
import parse from "html-react-parser";

const BenefitList = () => {
  const [benefitSearchTerm, setBenefitSearchTerm] = useState<string>("");
  const debouncedBenefitSearchTerm = useDebounce(benefitSearchTerm, 1000);

  const [sortOrder, setSortOrder] = useState("asc");
  const [benefitData, setBenefitData] = useState<IBenefit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBenefitSlug, setSelectedBenefitSlug] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const router = useRouter();
  const { admin } = useAuth();

  const canAddBenefit = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditBenefit =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteBenefit = admin?.role === "admin";
  const showActionsColumn = canEditBenefit || canDeleteBenefit;

  useEffect(() => {
    const fetchBenefits = async () => {
      if (!admin?.token) {
        toast.error("Please log in to view benefits.");
        router.push("/admin");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/benefit?page=${currentPage}&limit=${itemsPerPage}`,
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
          throw new Error(errorData.message ?? "Failed to fetch benefits");
        }

        const result = await response.json();
        console.log(result);

        if (result.error) {
          throw new Error(result.message);
        }

        if (result.data?.benefits) {
          setBenefitData(result.data.benefits);
        }
        if (result.data?.currentPage !== undefined) {
          setCurrentPage(result.data.currentPage);
        }
        if (result.data?.totalPages !== undefined) {
          setTotalPages(result.data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching benefits:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load benefits",
          { description: "Please try refreshing the page" }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, [admin, router, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async () => {
    if (!selectedBenefitSlug || !admin?.token || !canDeleteBenefit) {
      toast.error("You do not have permission to delete benefits.");
      setSelectedBenefitSlug(null);
      return;
    }

    try {
      const response = await fetch(`/api/benefit/${selectedBenefitSlug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message ?? "Failed to delete benefit");
      }

      setBenefitData((prev) =>
        prev.filter((ben) => ben.slug !== selectedBenefitSlug)
      );
      toast.success("Benefit deleted successfully!");
      setSelectedBenefitSlug(null);
    } catch (error) {
      console.error("Error deleting benefit:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete benefit",
        { description: "Please try again" }
      );
    }
  };

  const filteredBenefits = benefitData.filter((benefit) => {
    if (!benefit) return false;

    const nameMatch =
      benefit.title
        ?.toLowerCase()
        .includes(debouncedBenefitSearchTerm.toLowerCase()) || false;
    const slugMatch =
      benefit.slug
        ?.toLowerCase()
        .includes(debouncedBenefitSearchTerm.toLowerCase()) || false;

    const matchesSearch =
      debouncedBenefitSearchTerm === "" || nameMatch || slugMatch;

    return matchesSearch;
  });

  const sortedBenefits = [...filteredBenefits].sort((a, b) =>
    sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <BenefitSkeleton
          itemsPerPage={itemsPerPage}
          showActionsColumn={showActionsColumn}
        />
      );
    }

    if (sortedBenefits.length === 0) {
      return (
        <TableRow key="no-benefits">
          <TableCell colSpan={8} className="text-center text-white/70">
            No benefit found
          </TableCell>
        </TableRow>
      );
    }

    return sortedBenefits.map((benefit, index) => (
      <TableRow
        key={benefit.id || benefit.slug}
        className="border-white/10 hover:bg-white/5"
      >
        <TableCell className="text-white/70 text-md">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </TableCell>
        <TableCell className="text-white/70 text-md font-medium">
          {benefit.title}
        </TableCell>
        <TableCell className="text-white/70 text-md max-w-[200px] truncate">
          {benefit.slug || "No slug"}
        </TableCell>
        <TableCell className="text-white/70 text-md max-w-[200px] truncate">
          {benefit.description ? (
            <div className="rich-text-content max-h-4 overflow-hidden">
              {parse(
                benefit.description.length > 20
                  ? benefit.description.substring(0, 20) + "..."
                  : benefit.description
              )}
            </div>
          ) : (
            "No description"
          )}{" "}
        </TableCell>
        <TableCell className="text-white/70 text-md font-medium">
          {benefit.seoTitle}
        </TableCell>
        <TableCell className="text-white/70 text-md font-medium">
          {truncateText(benefit.metaDescription, 20)}
        </TableCell>
        <TableCell className="text-white/70 text-md font-medium">
          {benefit.metaKeywords}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {benefit.createdAt
            ? new Date(benefit.createdAt).toLocaleDateString()
            : "N/A"}
          {"   "}
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <div className="flex gap-2">
              {canEditBenefit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-400/20"
                  onClick={() => handleEdit(benefit.slug)}
                >
                  <Pencil className="w-4 h-4 text-emerald-400" />
                </Button>
              )}
              {canDeleteBenefit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-400/20"
                      onClick={() => setSelectedBenefitSlug(benefit.slug)}
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-950/90">
                    <AlertDialogHeader className="text-white">
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/80">
                        Are you sure you want to delete this Benefit{" "}
                        <strong>{benefit.title || "this benefit"}</strong>?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setSelectedBenefitSlug(null)}
                      >
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
    ));
  };

  const handleEdit = (slug: string) => {
    if (!canEditBenefit) {
      toast.error("You do not have permission to edit benefits.");
      return;
    }
    router.push(`/admin/dashboard/benefit/edit/${slug}`);
  };
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search Benefits..."
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={benefitSearchTerm}
              onChange={(e) => setBenefitSearchTerm(e.target.value)}
            />
          </div>

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
        {canAddBenefit && (
          <Button
            onClick={() => router.push("/admin/dashboard/benefit/add")}
            className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
          >
            <Plus size={16} />
            <span className="font-normal">Add Benefit</span>
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Benefit Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">ID</TableHead>
                  <TableHead className="text-white/70 text-md">Title</TableHead>

                  <TableHead className="text-white/70 text-md">Slug</TableHead>
                  <TableHead className="text-white/70 text-md">
                    Description
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
                    Created
                  </TableHead>
                  {showActionsColumn && (
                    <TableHead className="text-white/70 text-md">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableContent()}</TableBody>
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
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                    currentPage === page
                      ? "bg-emerald-500/20 text-emerald-400"
                      : ""
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
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default BenefitList;
