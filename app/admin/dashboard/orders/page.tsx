"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiResponse } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  customerId: string;
  cartId: string;
  shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
    locationUrl?: string;
  };
  subtotal: number;
  shipping: number;
  totalAmount: number;
  itemsCount: number;
  status:
  | "pending"
  | "confirm"
  | "processing"
  | "pickup"
  | "on the way"
  | "delivered"
  | "cancelled";
  paymentStatus?: "paid" | "unpaid";
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  contactNumber?: string;
  image?: string | null;
  role?: string;
}

interface Admin {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  contactNumber?: string;
  image?: string | null;
  role: string;
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

const OrdersPage = () => {
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const debouncedOrderSearchTerm = useDebounce(orderSearchTerm, 1000);
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
  } | null>(null);

  const [customers, setCustomers] = useState<{
    [key: string]: {
      name: string;
      email: string;
      phone: string;
      image?: string | null;
      role: string;
    };
  }>({});

  const [admins, setAdmins] = useState<{
    [key: string]: {
      name: string;
      email: string;
      phone: string;
      image?: string | null;
      role: string;
    };
  }>({});

  const { admin } = useAuth();
  const router = useRouter();
  const itemsPerPage = 10;

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Confirm", value: "confirm" },
    { label: "Processing", value: "processing" },
    { label: "Pickup", value: "pickup" },
    { label: "On the way", value: "ontheway" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!admin || !admin.token) {
      toast.error("Please log in to view orders");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(filter !== "all" && { status: filter }),
      });

      const orderResponse = await fetch(`/api/checkout?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!orderResponse.ok) {
        const text = await orderResponse.text();
        let errorMessage = `HTTP error! Status: ${orderResponse.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch {
          // Non-JSON response
        }
        if (orderResponse.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/admin");
          return;
        }
        throw new Error(errorMessage);
      }

      const orderData: ApiResponse = await orderResponse.json();
      console.log("Raw Order Data from /api/admin/orders:", orderData);

      if (orderData.error === false && orderData.data) {
        const filteredOrders = orderData.data.checkouts || [];
        if (filter !== "all") {
          const invalidOrders = filteredOrders.filter(
            (order: Order) => order.status !== filter
          );
          if (invalidOrders.length > 0) {
            toast.warning(
              "Some orders returned by the API do not match the selected filter."
            );
          }
        }

        setOrders(filteredOrders);
        setTotalPages(orderData.data.totalPages || 1);

        // Separate customer and admin IDs
        const customerIds: string[] = [];
        const adminIds: string[] = [];

        filteredOrders.forEach((order: Order) => {
          // Check if the customerId matches any admin ID pattern or has admin role
          if (order.customerId && order.customerId.includes('admin')) {
            adminIds.push(order.customerId);
          } else {
            customerIds.push(order.customerId);
          }
        });

        // Fetch customer data
        if (customerIds.length > 0) {
          const customerResponse = await fetch(
            `/api/users/profiles?ids=${customerIds.join(",")}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${admin.token}`,
              },
            }
          );

          if (!customerResponse.ok) {
            throw new Error(`HTTP error! Status: ${customerResponse.status}`);
          }

          const customerData = await customerResponse.json();

          if (
            customerData.error === false &&
            Array.isArray(customerData.data.users)
          ) {
            const customerMap: {
              [key: string]: {
                name: string;
                email: string;
                phone: string;
                image?: string | null;
                role: string;
              };
            } = {};
            customerData.data.users.forEach((customer: Customer) => {
              const customerId = customer.id || customer._id || "";
              customerMap[customerId] = {
                name: customer.name || "Unknown",
                email: customer.email || "N/A",
                phone: customer.contactNumber || customer.phone || "N/A",
                image: customer.image?.replace(/^\/public/, "") || null,
                role: customer.role || "customer",
              };
            });
            setCustomers(customerMap);
          }
        }

        // Fetch admin data
        if (adminIds.length > 0) {
          const adminResponse = await fetch(
            `/api/users/profiles?ids=${adminIds.join(",")}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${admin.token}`,
              },
            }
          );

          if (!adminResponse.ok) {
            throw new Error(`HTTP error! Status: ${adminResponse.status}`);
          }

          const adminData = await adminResponse.json();

          if (
            adminData.error === false &&
            Array.isArray(adminData.data.users)
          ) {
            const adminMap: {
              [key: string]: {
                name: string;
                email: string;
                phone: string;
                image?: string | null;
                role: string;
              };
            } = {};
            adminData.data.users.forEach((admin: Admin) => {
              const adminId = admin.id || admin._id || "";
              adminMap[adminId] = {
                name: admin.name || "Unknown Admin",
                email: admin.email || "N/A",
                phone: admin.contactNumber || admin.phone || "N/A",
                image: admin.image?.replace(/^\/public/, "") || null,
                role: admin.role || "admin",
              };
            });
            setAdmins(adminMap);
          }
        }
      } else {
        toast.error(orderData.message || "Failed to fetch orders");
        setOrders([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch orders",
        {
          description:
            error instanceof Error && error.message.includes("Unauthorized")
              ? "Please log out and log in again."
              : "Please try again or contact support.",
        }
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [admin, page, filter, router]);

  const openDeleteDialog = (order: {
    id: string;
  }) => {
    if (!admin?.role || admin.role !== "admin") {
      toast.error("You do not have permission to delete orders.");
      return;
    }
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  }

  const handleDeleteOrder = async () => {
    if (!admin || !admin.token || !selectedOrder) {
      toast.error("Authentication required or invalid order ID");
      return;
    }
    try {
      const response = await fetch(`/api/checkout/${selectedOrder.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (data.error === false) {
        toast.success("Order deleted successfully");
        setOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id));
        setIsDeleteDialogOpen(false);
        setSelectedOrder(null);
      } else {
        throw new Error(data.message || "Failed to delete order");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete order",
        {
          description: "Please try again or contact support.",
        }
      );
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedOrderSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Client-side filtering
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(debouncedOrderSearchTerm.toLowerCase()) ||
      customers[order.customerId]?.name
        ?.toLowerCase()
        .includes(debouncedOrderSearchTerm.toLowerCase()) ||
      customers[order.customerId]?.email
        ?.toLowerCase()
        .includes(debouncedOrderSearchTerm.toLowerCase())
  );

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
          <Skeleton className="h-4 w-16 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16 bg-white/10" />
        </TableCell>
      </TableRow>
    ));

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Orders Management</h1>
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search by order ID or customer..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="max-w-xs bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:ring-purple-500"
            />
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-white font-semibold text-2xl">Orders</CardTitle>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((statusFilter) => (
                  <Button
                    key={statusFilter.value}
                    variant={filter === statusFilter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(statusFilter.value)}
                    className={
                      filter === statusFilter.value
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                    }
                  >
                    {statusFilter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">Order ID</TableHead>
                    <TableHead className="text-white/70 text-md">Order Date</TableHead>
                    <TableHead className="text-white/70 text-md">Customer</TableHead>
                    <TableHead className="text-white/70 text-md">Total Amount</TableHead>
                    <TableHead className="text-white/70 text-md">Payment Method</TableHead>
                    <TableHead className="text-white/70 text-md">Status</TableHead>
                    <TableHead className="text-white/70 text-md">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    renderSkeletonRows()
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="font-medium text-white/70 text-md">
                          {order.id}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  admins[order.customerId]?.image ||
                                  customers[order.customerId]?.image ||
                                  "/placeholder.svg"
                                }
                                alt="Avatar"
                              />
                              <AvatarFallback className="bg-purple-600">
                                {(
                                  admins[order.customerId]?.name ||
                                  customers[order.customerId]?.name ||
                                  "U"
                                )
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-white/70 text-md">
                                {admins[order.customerId]?.name ||
                                  customers[order.customerId]?.name ||
                                  "Unknown"}
                                {admins[order.customerId] && (
                                  <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-0">
                                    Admin
                                  </Badge>
                                )}
                              </span>
                              <p className="text-white/50 text-xs">
                                {admins[order.customerId]?.email ||
                                  customers[order.customerId]?.email ||
                                  "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          Rs {order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {order.paymentMethod
                            ? order.paymentMethod === "cod"
                              ? "Cash on Delivery"
                              : order.paymentMethod.charAt(0).toUpperCase() +
                              order.paymentMethod.slice(1)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-0"
                                : order.status === "confirm"
                                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-0"
                                  : order.status === "processing"
                                    ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-0"
                                    : order.status === "pickup"
                                      ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border-0"
                                      : order.status === "on the way"
                                        ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-0"
                                        : order.status === "delivered"
                                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/20 border-0"
                                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                            }
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="hover:bg-gray-400/20"
                            >
                              <Link href={`/admin/dashboard/orders/${order.id}`}>
                                <Eye className="h-4 w-4 text-white/70" />
                                <span className="sr-only">View details</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-400/20"
                              onClick={() => order.id && openDeleteDialog({
                                id: order.id,
                              })}
                            >
                              <span className="text-red-500">
                                <Trash2 />
                              </span>
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-white/70"
                      >
                        No orders found.
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
                  onClick={() => handlePageChange(page - 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${page === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${page === pageNumber ? "bg-gray-500/20" : ""
                        }`}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(page + 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${page === totalPages ? "pointer-events-none opacity-50" : ""
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
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this order{" "}
              <strong>{selectedOrder?.id || "this order"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
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

export default OrdersPage;