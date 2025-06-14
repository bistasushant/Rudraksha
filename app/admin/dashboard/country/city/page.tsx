"use client";
import { useEffect, useState, useCallback } from "react";
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
import { ICityResponse, IProvinceResponse } from "@/types";
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


const CityPage = () => {
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const debouncedCitySearchTerm = useDebounce(citySearchTerm, 1000);
  const [cityData, setCityData] = useState<ICityResponse[]>([]);
  const [provinces, setProvinces] = useState<IProvinceResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  const canAddCity = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditCity = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteCity = admin?.role === "admin";
  const showActionsColumn = canEditCity || canDeleteCity;

  // Fetch provinces once
  useEffect(() => {
    if (!admin?.token || provinces.length > 0) return;

    const fetchProvinces = async () => {
      try {
        const provinceResponse = await fetch("/api/province", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!provinceResponse.ok) {
          const errorData = await provinceResponse.json();
          throw new Error(errorData.message || "Failed to fetch provinces");
        }

        const provinceResult = await provinceResponse.json();
        setProvinces(provinceResult.data?.provinces || []);
      } catch {
        toast.error("Failed to load provinces", {
          description: "Some province names may not display correctly.",
        });
      }
    };

    fetchProvinces();
  }, [admin?.token, provinces.length]);

  // Memoized fetch cities function
  const fetchCities = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view cities.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      }).toString();

      const cityResponse = await fetch(`/api/city?${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      });

      if (!cityResponse.ok) {
        const errorData = await cityResponse.json();
        throw new Error(errorData.message || "Failed to fetch cities");
      }

      const cityResult = await cityResponse.json();
      setCityData(cityResult.data?.cities || []);
      setTotalPages(cityResult.data?.totalPages || 1);
      if (cityResult.data?.page) {
        setCurrentPage(Math.min(cityResult.data.page, cityResult.data.totalPages));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load cities", {
        description: "Please try refreshing the page",
      });
    } finally {
      setLoading(false);
    }
  }, [admin?.token, router, currentPage]);

  // Fetch cities when page changes or on initial load
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Reset page when search term changes significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedCitySearchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !admin?.token || !canDeleteCity) {
      toast.error("You do not have permission to delete cities.");
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(`/api/city/${selectedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to delete city");
      }

      setCityData((prev) => prev.filter((city) => city.id !== selectedId));
      toast.success("City deleted successfully!");
      setSelectedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete city", {
        description: "Please try again",
      });
    }
  };

  const getProvinceNames = (provinceId: string | null | undefined) => {
    if (!provinceId) {
      return "No State or Province";
    }
    const province = provinces.find((p) => p.id === provinceId);
    return province ? province.name : "Unknown Province";
  };

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-12 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16 bg-white/10" />
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

  // Client-side filtering
  const filteredCity = cityData.filter((city) =>
    city.name.toLowerCase().includes(debouncedCitySearchTerm.toLowerCase())
  );

  const handleEdit = (id: string) => {
    if (!canEditCity) {
      toast.error("You do not have permission to edit cities.");
      return;
    }
    router.push(`/admin/dashboard/country/city/edit/${id}`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search by city name"
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={citySearchTerm}
              onChange={(e) => setCitySearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {canAddCity && (
          <Button
            onClick={() => router.push("/admin/dashboard/country/city/add")}
            className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            disabled={loading}
          >
            <Plus size={16} />
            <span className="font-normal">Add City</span>
          </Button>
        )}
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">City List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">ID</TableHead>
                  <TableHead className="text-white/70 text-md">Name</TableHead>
                  <TableHead className="text-white/70 text-md">Province Name</TableHead>
                  <TableHead className="text-white/70 text-md">Shipping Cost</TableHead>
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
                ) : filteredCity.length > 0 ? (
                  filteredCity.map((city, index) => (
                    <TableRow
                      key={city.id}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white/70 text-md">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-white/70 text-md font-medium">
                        {city.name}
                      </TableCell>
                      <TableCell className="text-white/70 text-md font-medium">
                        {getProvinceNames(city.provinceId)}
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        ${city.shippingCost?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${city.isActive
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            }`}
                        >
                          {city.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {city.createdAt
                          ? new Date(city.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEditCity && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-400/20"
                                onClick={() => handleEdit(city.id)}
                              >
                                <Pencil className="w-4 h-4 text-emerald-400" />
                              </Button>
                            )}
                            {canDeleteCity && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-gray-400/20"
                                    onClick={() => setSelectedId(city.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950/90">
                                  <AlertDialogHeader className="text-white">
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription className="text-white/80">
                                      Are you sure you want to delete the city{" "}
                                      {city.name || "this city"}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedId(null)}>
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
                  <TableRow key="no-city">
                    <TableCell
                      colSpan={showActionsColumn ? 7 : 6}
                      className="text-center text-white/70"
                    >
                      No cities found
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

export default CityPage;