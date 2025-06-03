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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ICountryResponse } from "@/types";
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
import { useDebounce } from "@/hooks/useDebounce";

const CountryPage = () => {
  const [countrySearchTerm, setCountrySearchTerm] = useState<string>("");
  const debouncedCountrySearchTerm = useDebounce(countrySearchTerm, 1000);

  const [countriesData, setCountriesData] = useState<ICountryResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const router = useRouter();
  const { admin } = useAuth();

  const canAddCountry =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditCountry =
    admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteCountry = admin?.role === "admin";
  const showActionsColumn = canEditCountry || canDeleteCountry;

  useEffect(() => {
    const fetchCountries = async () => {
      if (!admin?.token) {
        toast.error("Please log in to view countries.");
        router.push("/admin");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/country?page=${currentPage}&limit=${itemsPerPage}`,
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
          throw new Error(errorData.message || "Failed to fetch countries");
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.message);
        }

        setCountriesData(result.data?.countries || result.data || []);

        const totalPagesFromResponse =
          result.data?.totalPages || result.totalPages || 1;
        setTotalPages(totalPagesFromResponse);

        setCurrentPage(result.data?.currentPage || result.page || currentPage);
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load countries",
          { description: "Please try refreshing the page" }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [admin, router, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const filteredCountry = countriesData.filter((country) =>
    country.name.toLowerCase().includes(debouncedCountrySearchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedId || !admin?.token || !canDeleteCountry) {
      toast.error("You do not have permission to delete countries.");
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(`/api/country/${selectedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to delete country");
      }

      // Remove the deleted country from local state
      setCountriesData((prev) =>
        prev.filter((country) => country.id !== selectedId)
      );
      toast.success("Country deleted successfully!");
      setSelectedId(null);
    } catch (error) {
      console.error("Error deleting country:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete country",
        { description: "Please try again" }
      );
    }
  };

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
  const handleEdit = (id: string) => {
    if (!canEditCountry) {
      toast.error("You do not have permission to edit countries.");
      return;
    }
    router.push(`/admin/dashboard/country/country/edit/${id}`);
  };
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search by name"
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={countrySearchTerm}
              onChange={(e) => setCountrySearchTerm(e.target.value)}
            />
          </div>
        </div>
        {canAddCountry && (
          <Button
            onClick={() => router.push("/admin/dashboard/country/country/add")}
            className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
          >
            <Plus size={16} />
            <span className="font-normal">Add Country</span>
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Country List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">ID</TableHead>
                  <TableHead className="text-white/70 text-md">Name</TableHead>
                  <TableHead className="text-white/70 text-md">
                    Status
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
              <TableBody>
                {loading ? (
                  renderSkeletonRows()
                ) : filteredCountry.length > 0 ? (
                  filteredCountry.map((country, index) => (
                    <TableRow
                      key={country.id}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white/70 text-md">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-white/70 text-md font-medium">
                        {country.name}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${country.isActive
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            }`}
                        >
                          {country.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {country.createdAt
                          ? new Date(country.createdAt).toLocaleDateString()
                          : "N/A"}
                        {"   "}
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEditCountry && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-400/20"
                                onClick={() => handleEdit(country.id)}
                              >
                                <Pencil className="w-4 h-4 text-emerald-400" />
                              </Button>
                            )}
                            {canDeleteCountry && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-gray-400/20"
                                    onClick={() => setSelectedId(country.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950/90">
                                  <AlertDialogHeader className="text-white">
                                    <AlertDialogTitle>
                                      Confirm Deletion
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/80">
                                      Are you sure you want to delete this
                                      category {country.name || "this country"}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      onClick={() => setSelectedId(null)}
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
                  ))
                ) : (
                  <TableRow key="no-categories">
                    <TableCell
                      colSpan={showActionsColumn ? 5 : 4}
                      className="text-center text-white/70"
                    >
                      No Country found
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}
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
  );
};

export default CountryPage;
