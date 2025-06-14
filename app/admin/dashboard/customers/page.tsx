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
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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

interface ICustomer {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  image: string | null;
}

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


const CustomersPage = () => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const debouncedCustomerSearchTerm = useDebounce(customerSearchTerm, 1000);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [customersData, setCustomersData] = useState<ICustomer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  const fetchCustomers = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view customers.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const customersResponse = await fetch(
        `/api/customer?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!customersResponse.ok) {
        // Handle HTTP error status codes without throwing
        if (customersResponse.status === 404) {
          // Handle "No customers found" case gracefully
          setCustomersData([]);
          setTotalItems(0);
          setTotalPages(1);
          return;
        }

        const errorData = await customersResponse.json();
        throw new Error(errorData.message || "Failed to fetch customers");
      }

      const customersResult = await customersResponse.json();

      // Gracefully handle the case when no users are found
      if (
        customersResult.error &&
        customersResult.message?.includes("No customer found")
      ) {
        setCustomersData([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      if (customersResult.error) {
        throw new Error(customersResult.message);
      }

      // Handle case where users array is empty or missing
      if (!customersResult.data || !Array.isArray(customersResult.data.users)) {
        setCustomersData([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      const validCustomers = customersResult.data.users.filter(
        (customer: ICustomer) =>
          customer.id &&
          customer.name != null &&
          customer.email != null &&
          typeof customer.name === "string" &&
          typeof customer.email === "string"
      );

      setCustomersData(validCustomers);
      setCurrentPage(customersResult.data.pagination?.page || 1);
      setTotalPages(customersResult.data.pagination?.totalPages || 1);
      setTotalItems(
        customersResult.data.pagination?.total || validCustomers.length
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Only show toast for real errors, not for "no customers found"
      if (
        !(error instanceof Error && error.message.includes("No customer found"))
      ) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load customers.",
          {
            description: "Please try again later.",
          }
        );
      }

      // Set empty state in case of any error
      setCustomersData([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, router]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customersData.filter((customer) => {
    const name = customer.name || "";
    const email = customer.email || "";
    return (
      name.toLowerCase().includes(debouncedCustomerSearchTerm.toLowerCase()) ||
      email.toLowerCase().includes(debouncedCustomerSearchTerm.toLowerCase())
    );
  });

  const sortedCustomers = filteredCustomers.sort((a, b) => {
    const nameA = a.name || "";
    const nameB = b.name || "";
    return sortOrder === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (customer: {
    id: string;
    email: string;
    name: string;
  }) => {
    if (!admin?.role || admin.role !== "admin") {
      toast.error("You do not have permission to delete customers.");
      return;
    }

    if (!customer.id) {
      toast.error("Customer ID is missing.");
      return;
    }

    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer || !admin?.token || admin.role !== "admin") {
      toast.error("You do not have permission to delete customers.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/customer/${selectedCustomer.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete customer",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const canDeleteCustomer = admin?.role === "admin";
  const showActionsColumn = canDeleteCustomer;

  const renderSkeletonRows = () => {
    // Use actual data length if available, otherwise fallback to itemsPerPage
    const rowCount =
      loading && customersData.length > 0
        ? Math.min(customersData.length, itemsPerPage)
        : Math.min(totalItems, itemsPerPage);

    return Array.from({ length: rowCount }).map((_, index) => (
      <TableRow key={`skeleton-row-${index}`} className="border-white/10">
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
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <Skeleton className="h-8 w-8 bg-white/10" />
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search by customer name or email..."
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
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
                A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                Z-A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">
                    Customer ID
                  </TableHead>
                  <TableHead className="text-white/70 text-md">
                    Customer Name
                  </TableHead>
                  <TableHead className="text-white/70 text-md">Email</TableHead>
                  <TableHead className="text-white/70 text-md">
                    Phone Number
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
                ) : sortedCustomers.length > 0 ? (
                  sortedCustomers.map((customer, index) => (
                    <TableRow
                      key={customer.id}
                      className="border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white/70 text-md">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={customer.image || "/placeholder.svg"}
                              alt="Customer Image"
                            />
                            <AvatarFallback className="bg-purple-600">
                              {(customer.name || "").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white/70 text-md">
                            {customer.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {customer.email || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/70 text-md">
                        {customer.contactNumber || "N/A"}
                      </TableCell>
                      {showActionsColumn && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canDeleteCustomer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-400/20"
                                onClick={() =>
                                  openDeleteDialog({
                                    id: customer.id,
                                    email: customer.email,
                                    name: customer.name,
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
                      colSpan={showActionsColumn ? 5 : 4}
                      className="text-center text-white/70"
                    >
                      No customers found.
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
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={`page-${page}`}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page);
                  }}
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
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                  }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. You are about to permanently delete
              the customer{" "}
              <strong>
                {selectedCustomer?.name ||
                  selectedCustomer?.email ||
                  "this customer"}
              </strong>
              .
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
    </div>
  );
};

export default CustomersPage;
