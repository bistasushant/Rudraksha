"use client";
import React, { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { IFaq } from "@/types";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import FaqSkeleton from "./FaqSkeleton";

const FaqList = () => {
  const [faqSearchTerm, setFaqSearchTerm] = useState<string>("");
  const debouncedFaqSearchTerm = useDebounce(faqSearchTerm, 1000);

  const [faqData, setFaqData] = useState<IFaq[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  // RBAC Permissions
  const canAddFaq = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditFaq = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteFaq = admin?.role === "admin";
  const showActionsColumn = canEditFaq || canDeleteFaq;

  const fetchFaqData = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view faqs.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/faq?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "Failed to fetch faqs");
      }

      const result = await response.json();
      console.log("FAQ Data:", result); // Debug log

      if (result.error) {
        throw new Error(result.message);
      }

      if (result.data?.faqs) {
        setFaqData(result.data.faqs);
        setCurrentPage(result.data.page ?? 1);
        setTotalPages(result.data.totalPages ?? 1);
      } else {
        setFaqData([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
      setFaqData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, router, itemsPerPage]);

  useEffect(() => {
    fetchFaqData();
  }, [fetchFaqData]);

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question
        ?.toLowerCase()
        .includes(debouncedFaqSearchTerm.toLowerCase()) ?? false
  );

  const sortedFaqs = filteredFaqs.toSorted((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleEdit = (slug: string) => {
    if (!canEditFaq) {
      toast.error("You do not have permission to edit faqs.");
      return;
    }
    if (!slug) {
      toast.error("Invalid FAQ slug");
      return;
    }
    router.push(`/admin/dashboard/faq/edit/${encodeURIComponent(slug)}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (faq: { id: string; slug: string }) => {
    if (!canDeleteFaq) {
      toast.error("You do not have permission to delete faqs.");
      return;
    }
    setSelectedFaq(faq);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFaq || !admin?.token || !canDeleteFaq) {
      toast.error("You do not have permission to delete faqs.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/faq/${selectedFaq.slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "Failed to delete faq");
      }
      toast.success("FAQ deleted successfully");
      fetchFaqData();
    } catch (error) {
      console.error("Error deleting faq:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete faq",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedFaq(null);
    }
  };

  const truncateText = (text: string | undefined, maxLength: number = 20) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <FaqSkeleton
          itemsPerPage={itemsPerPage}
          showActionsColumn={showActionsColumn}
        />
      );
    }

    if (sortedFaqs.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={showActionsColumn ? 8 : 7}
            className="text-center text-white/70"
          >
            No FAQ found.
          </TableCell>
        </TableRow>
      );
    }

    return sortedFaqs.map((faq, index) => (
      <TableRow key={faq.id} className="border-white/10 hover:bg-white/5">
        <TableCell className="text-white/70 text-md">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {truncateText(faq.question)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {truncateText(faq.slug)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {faq.answer ? (
            <div className="rich-text-content max-h-4 overflow-hidden">
              {truncateText(faq.answer.replace(/<[^>]*>/g, ''), 20)}
            </div>
          ) : (
            "No answer"
          )}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {truncateText(faq.seoTitle)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {truncateText(faq.metaDescription)}
        </TableCell>
        <TableCell className="text-white/70 text-md">
          {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : "N/A"}
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <div className="flex gap-2">
              {canEditFaq && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-400/20"
                  onClick={() => handleEdit(faq.slug)}
                >
                  <span className="text-blue-500">
                    <Pencil />
                  </span>
                </Button>
              )}
              {canDeleteFaq && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-400/20"
                  onClick={() =>
                    faq.id &&
                    faq.slug &&
                    openDeleteDialog({
                      id: faq.id,
                      slug: faq.slug,
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
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2 text-white/50" />
              <Input
                type="text"
                placeholder="Search FAQ...."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={faqSearchTerm}
                onChange={(e) => setFaqSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <span className="font-normal">Sort by Date</span>
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  Newest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canAddFaq && (
            <Button
              onClick={() => router.push("/admin/dashboard/faq/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add FAQ</span>
            </Button>
          )}
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              FAQ List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">ID</TableHead>
                    <TableHead className="text-white/70 text-md">
                      Question
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Slug
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Answer
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      SEO Title
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Meta Description
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Date
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
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
                )
              )}
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete FAQ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
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

export default FaqList;
