"use client";
import React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { ITestimonial } from "@/types";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import parse from "html-react-parser";
import { renderStars } from "@/components/admin/RenderStars";
import { useDebounce } from "@/hooks/useDebounce";


const TestimonialPage = () => {
  const [testimonialData, setTestimonialData] = useState<ITestimonial[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const [testimonialSearchTerm, setTestimonialSearchTerm] = useState<string>("");
  const debouncedTestimonialSearchTerm = useDebounce(testimonialSearchTerm, 1000);

  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  // RBAC Permissions
  const canAddTestimonial = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditTestimonial = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteTestimonial = admin?.role === "admin";
  const showActionsColumn = canEditTestimonial || canDeleteTestimonial;

  const fetchTestimonialData = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view testimonials.");
      router.push("/admin");
      return;
    }
    try {
      setLoading(true);
      const testimonialResponse = await fetch(
        `/api/testimonial?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!testimonialResponse.ok) {
        const errorData = await testimonialResponse.json();
        throw new Error(errorData.message || "Failed to fetch testimonials data");
      }

      const testimonialResult = await testimonialResponse.json();
      if (testimonialResult.error) {
        throw new Error(testimonialResult.message);
      }

      setTestimonialData(testimonialResult.data?.testimonials || []);
      setCurrentPage(testimonialResult.data?.page || 1);
      setTotalPages(testimonialResult.data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, router, itemsPerPage]);

  useEffect(() => {
    fetchTestimonialData();
  }, [fetchTestimonialData]);

  const filteredTestimonials = testimonialData.filter((testimonial) =>
    testimonial.fullName.toLowerCase().includes(debouncedTestimonialSearchTerm.toLowerCase())
  );

  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleEdit = (slug: string) => {
    if (!canEditTestimonial) {
      toast.error("You do not have permission to edit testimonials.");
      return;
    }
    router.push(`/admin/dashboard/testimonial/edit/${slug}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (testimonial: { id: string; slug: string }) => {
    if (!canDeleteTestimonial) {
      toast.error("You do not have permission to delete testimonial.");
      return;
    }
    setSelectedTestimonial(testimonial);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTestimonial || !admin?.token || !canDeleteTestimonial) {
      toast.error("You do not have permission to delete testimonial.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/testimonial/${selectedTestimonial.slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete testimonial");
      }
      toast.success("Testimonial deleted successfully");
      fetchTestimonialData();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete testimonial",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTestimonial(null);
    }
  };

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-8 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
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
                placeholder="Search Testimonial...."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={testimonialSearchTerm}
                onChange={(e) => setTestimonialSearchTerm(e.target.value)}
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
          {canAddTestimonial && (
            <Button
              onClick={() => router.push("/admin/dashboard/testimonial/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add Testimonial</span>
            </Button>
          )}
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Testimonial List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">
                      ID
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Image
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Full Name
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Slug
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Address
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Rating
                    </TableHead>
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
                      Date
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
                  ) : sortedTestimonials.length > 0 ? (
                    sortedTestimonials.map((testimonial, index) => (
                      <TableRow
                        key={testimonial.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="text-white/70 text-md">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={testimonial.image || "image/placeholder.png"}
                              alt="Blog Image"
                            />
                            <AvatarFallback className="bg-purple-600">
                              P
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.fullName}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.slug}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.address.length > 20
                            ? `${testimonial.address.substring(0, 20)}...`
                            : testimonial.address}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {renderStars(testimonial.rating)}
                        </TableCell>

                        <TableCell className="text-white/70 text-md">
                          {testimonial.description ? (
                            <div className="rich-text-content max-h-4 overflow-hidden">
                              {parse(testimonial.description.length > 20
                                ? `${testimonial.description.substring(0, 20)}...`
                                : testimonial.description)}
                            </div>
                          ) : (
                            "No testimonial description"
                          )}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.seoTitle}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.metaDescription
                            ? testimonial.metaDescription.length > 20
                              ? `${testimonial.metaDescription.substring(0, 20)}...`
                              : testimonial.metaDescription
                            : ""}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.metaKeywords
                            ? testimonial.metaKeywords.length > 20
                              ? `${testimonial.metaKeywords.substring(0, 20)}...`
                              : testimonial.metaKeywords
                            : ""}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {testimonial.createdAt
                            ? new Date(testimonial.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        {showActionsColumn && (
                          <TableCell>
                            <div className="flex gap-2">
                              {canEditTestimonial && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    testimonial.slug && handleEdit(testimonial.slug)
                                  }
                                >
                                  <span className="text-blue-500">
                                    <Pencil />
                                  </span>
                                </Button>
                              )}
                              {canDeleteTestimonial && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    testimonial.id &&
                                    testimonial.slug &&
                                    openDeleteDialog({
                                      id: testimonial.id,
                                      slug: testimonial.slug,
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
                        colSpan={showActionsColumn ? 12 : 7}
                        className="text-center text-white/70"
                      >
                        No testimonials found.
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
              Delete Testimonial
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this testimonial? This action cannot be
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

export default TestimonialPage;
