"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { ApiResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf"; // Correct import for jsPDF
import { Types } from "mongoose";

interface Order {
  id: string;
  customerId: string;
  cartId: string;
  shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    province: string;
    city: string;
    postalCode?: string;
    locationUrl?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    size?: {
      size?: string;
      price: number;
      sizeId?: string;
    } | null;
    design?: {
      title: string;
      price: number;
      image: string;
    } | null;
  }>;
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
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string | null;
  role?: string;
}

// Interface for customer data from API
interface FetchedCustomer {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  contactNumber?: string;
  image?: string | null;
  role?: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderStatus, setOrderStatus] = useState<
    | "pending"
    | "confirm"
    | "processing"
    | "pickup"
    | "on the way"
    | "delivered"
    | "cancelled"
  >("pending");
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuth();
  const router = useRouter();
  const [countryName, setCountryName] = useState<string>("");
  const [provinceName, setProvinceName] = useState<string>("");
  const [cityName, setCityName] = useState<string>("");

  const getCountryNames = useCallback(async (countryId: string | Types.ObjectId) => {
    try {
      const response = await fetch(`/api/country/${countryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin?.token}`,
        },
      });
  
      if (!response.ok) {
        // Return a fallback instead of throwing an error
        console.warn(`Could not fetch country name for ID: ${countryId}`);
        return "Not available";
      }
  
      const data = await response.json();
      // The response has data directly in data, not in data.country
      return data?.data?.name || "Not available";
    } catch (error) {
      console.error("Error fetching country name:", error);
      return "Not available"; // Return a fallback value
    }
  }, [admin?.token]);


  const getProvinceNames = useCallback(async (provinceId: string | Types.ObjectId) => {
    try {
      const response = await fetch(`/api/province/${provinceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin?.token}`,
        },
      });
  
      if (!response.ok) {
        // Return a fallback instead of throwing an error
        console.warn(`Could not fetch province name for ID: ${provinceId}`);
        return "Not available";
      }
  
      const data = await response.json();
      // Access name directly from data response
      return data?.data?.name || "Not available";
    } catch (error) {
      console.error("Error fetching province name:", error);
      return "Not available"; // Return a fallback value
    }
  }, [admin?.token]);

  const getCityNames = useCallback(async (cityId: string | Types.ObjectId) => {
    try {
      const response = await fetch(`/api/city/${cityId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin?.token}`,
        },
      });
  
      if (!response.ok) {
        // Return a fallback instead of throwing an error
        console.warn(`Could not fetch city name for ID: ${cityId}`);
        return "Not available";
      }
  
      const data = await response.json();
      // Access name directly from data response
      return data?.data?.name || "Not available";
    } catch (error) {
      console.error("Error fetching city name:", error);
      return "Not available"; // Return a fallback value
    }
  }, [admin?.token]);

  useEffect(() => {
    if (!admin || !admin.token) {
      toast.error("Please log in to view order details");
      router.push("/admin");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch order data
        const orderResponse = await fetch(`/api/checkout/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!orderResponse.ok) {
          const text = await orderResponse.text();
          console.error("Order Response Error:", orderResponse.status, text);
          throw new Error(
            `HTTP error! Status: ${orderResponse.status}: ${text}`
          );
        }

        const orderData: ApiResponse = await orderResponse.json();
        const fetchedOrder = orderData.data.checkout;

        const mappedOrder: Order = {
          ...fetchedOrder,
          id: fetchedOrder._id || fetchedOrder.id,
          items: fetchedOrder.items || [],
          createdAt: fetchedOrder.createdAt || new Date().toISOString(),
          updatedAt: fetchedOrder.updatedAt || new Date().toISOString(),
          subtotal: fetchedOrder.subtotal || 0,
          shipping: fetchedOrder.shipping || 0,
          totalAmount: fetchedOrder.totalAmount || 0,
          itemsCount: fetchedOrder.itemsCount || 0,
          status: fetchedOrder.status || "pending",
          
        };
        setOrder(mappedOrder);
        setOrderStatus(mappedOrder.status);
        setPaymentStatus(mappedOrder.paymentStatus === "paid");

        if (fetchedOrder.shippingDetails.countryId) {
          const countryName = await getCountryNames(fetchedOrder.shippingDetails.countryId);
          setCountryName(countryName);
        }
        
        if (fetchedOrder.shippingDetails.provinceId) {
          const provinceName = await getProvinceNames(fetchedOrder.shippingDetails.provinceId);
          setProvinceName(provinceName);
        }
        
        if (fetchedOrder.shippingDetails.cityId) {
          const cityName = await getCityNames(fetchedOrder.shippingDetails.cityId);
          setCityName(cityName);
        }

        // Fetch customer data
        const customerResponse = await fetch(
          `/api/users/profiles?ids=${fetchedOrder.customerId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${admin.token}`,
            },
          }
        );

        if (!customerResponse.ok) {
          const text = await customerResponse.text();
          console.error(
            "Customer Response Error:",
            customerResponse.status,
            text
          );
          throw new Error(
            `HTTP error! Status: ${customerResponse.status}: ${text}`
          );
        }

        const customerData = await customerResponse.json();

        if (customerData.error || !customerData.data?.users) {
          throw new Error(customerData.message || "Failed to fetch customer");
        }

        // Find the user with the matching ID
        const fetchedUser = customerData.data.users.find(
          (user: FetchedCustomer) =>
            (user._id === fetchedOrder.customerId ||
              user.id === fetchedOrder.customerId) &&
            user.email !== undefined
        );
        if (!fetchedUser) {
          throw new Error("User not found for the provided ID");
        }

        const userId =
          fetchedUser._id || fetchedUser.id || fetchedOrder.customerId;
        if (
          userId !== fetchedOrder.customerId &&
          fetchedUser.id !== fetchedOrder.customerId
        ) {
          console.error(
            "User ID mismatch:",
            userId,
            fetchedOrder.customerId
          );
          throw new Error("Fetched user does not match order user ID");
        }

        setCustomer({
          id: userId,
          name: fetchedUser.name || "Unknown",
          email: fetchedUser.email || "N/A",
          phone:
            fetchedUser.contactNumber || fetchedUser.phone || "N/A",
          image: fetchedUser.image?.replace(/^\/public/, "") || null,
          role: fetchedUser.role || "customer",
        });
      } catch (error) {
        console.error("Fetch Data Error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to fetch order details",
          {
            description: "Please try again or contact support.",
          }
        );
        setOrder(null);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, admin, router, getCityNames, getCountryNames, getProvinceNames]);

  const handleStatusChange = async (
    newStatus:
      | "pending"
      | "confirm"
      | "processing"
      | "pickup"
      | "on the way"
      | "delivered"
      | "cancelled"
  ) => {
    if (!admin?.token) {
      toast.error("Unauthorized. Please log in.");
      return;
    }

    try {
      const response = await fetch(`/api/checkout/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      setOrderStatus(newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
        {
          description: "Please try again or contact support.",
        }
      );
    }
  };

  

  const handlePaymentStatusChange = async (checked: boolean) => {
    if (!admin?.token) {
      toast.error("Unauthorized. Please log in.");
      return;
    }

    try {
      const response = await fetch(`/api/checkout/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ paymentStatus: checked ? "paid" : "unpaid" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update payment status");
      }

      setPaymentStatus(checked);
      setOrder((prev) =>
        prev ? { ...prev, paymentStatus: checked ? "paid" : "unpaid" } : null
      );
      toast.success("Payment status updated successfully!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update payment status",
        {
          description: "Please try again or contact support.",
        }
      );
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const generatePaymentSlipHTML = () => {
    if (!order || !customer) return "";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Slip - Order ${order.id}</title>
        <style>
          body { font-family: Arial stundout; margin: 20px; }
          .container { max-width: 800px; margin: auto; border: 1px solid #ccc; padding: 20px; }
          .header { text-align: center; }
          .section { margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Slip</h1>
            <p>Order ID: ${order.id}</p>
            <p>Date: ${formatDate(order.createdAt)}</p>
          </div>
          <div class="section">
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
          </div>
          <div class="section">
            <h2>Shipping Details</h2>
            <p><strong>Name:</strong> ${order.shippingDetails.fullName}</p>
            <p><strong>Email:</strong> ${order.shippingDetails.email}</p>
             <p><strong>Country:</strong> ${countryName}</p>
              <p><strong>Province:</strong> ${provinceName}</p>
               <p><strong>City:</strong> ${cityName}</p>
            <p><strong>Address:</strong> ${order.shippingDetails.address},${
      order.shippingDetails.postalCode
        ? ", " + order.shippingDetails.postalCode
        : ""
    }</p>
            <p><strong>Phone:</strong> ${order.shippingDetails.phone}</p>
          </div>
          <div class="section">
            <h2>Order Details</h2>
            <table>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>Rs ${item.price.toFixed(2)}</td>
                  <td>Rs ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            <p class="total">Subtotal: Rs ${order.subtotal.toFixed(2)}</p>
            <p class="total">Delivery Charge: Rs ${order.shipping.toFixed(
              2
            )}</p>
            <p class="total">Grand Total: Rs ${order.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${
              order.paymentStatus === "paid" ? "Paid" : "Unpaid"
            }</p>
            <p><strong>Payment Method:</strong> ${
              order.paymentMethod
                ? order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : order.paymentMethod.charAt(0).toUpperCase() +
                    order.paymentMethod.slice(1)
                : "N/A"
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePaymentSlipClick = () => {
    if (!order || !customer) {
      toast.error("Order or customer data not available");
      return;
    }
    const htmlContent = generatePaymentSlipHTML();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadInvoice = () => {
    if (!order || !customer) {
      toast.error("Order or customer data not available");
      return;
    }

    try {
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(20);
      doc.text("Payment Slip", 105, y, { align: "center" });
      y += 10;
      doc.setFontSize(12);
      doc.text(`Order ID: ${order.id}`, 20, y);
      y += 10;
      doc.text(`Date: ${formatDate(order.createdAt)}`, 20, y);
      y += 20;

      // Customer Information
      doc.setFontSize(14);
      doc.text("Customer Information", 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Name: ${customer.name}`, 20, y);
      y += 10;
      doc.text(`Email: ${customer.email}`, 20, y);
      y += 10;
      doc.text(`Phone: ${customer.phone}`, 20, y);
      y += 20;

      // Shipping Details
      doc.setFontSize(14);
      doc.text("Shipping Details", 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Name: ${order.shippingDetails.fullName}`, 20, y);
      y += 10;
      doc.text(`Email: ${order.shippingDetails.email}`, 20, y);
      y += 10
      doc.setFontSize(12);
      doc.text(`Email: ${order.shippingDetails.email}`, 20, y);
      y += 10
      doc.setFontSize(12);
      doc.text(`Country: ${countryName}`, 20, y);
      y += 10
      doc.setFontSize(12);
      doc.text(`Province: ${provinceName}`, 20, y);
      y += 10
      doc.setFontSize(12);
      doc.text(`City: ${cityName}`, 20, y);
      y += 10

      doc.text(
        `Address: ${order.shippingDetails.address}, ${
          order.shippingDetails.postalCode
            ? ", " + order.shippingDetails.postalCode
            : ""
        }`,
        20,
        y
      );
      y += 10;
      doc.text(`Phone: ${order.shippingDetails.phone}`, 20, y);
      y += 20;

      // Order Details
      doc.setFontSize(14);
      doc.text("Order Details", 20, y);
      y += 10;

      // Table Header
      doc.setFontSize(12);
      doc.text("Product", 20, y);
      doc.text("Quantity", 100, y);
      doc.text("Price", 130, y);
      doc.text("Total", 160, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      // Table Rows
      order.items.forEach((item) => {
        doc.text(item.name.substring(0, 30), 20, y);
        doc.text(item.quantity.toString(), 100, y);
        doc.text(`Rs ${item.price.toFixed(2)}`, 130, y);
        doc.text(`Rs ${(item.price * item.quantity).toFixed(2)}`, 160, y);
        y += 10;
      });

      // Totals
      y += 10;
      doc.text(`Subtotal: Rs ${order.subtotal.toFixed(2)}`, 20, y);
      y += 10;
      doc.text(`Delivery Charge: Rs ${order.shipping.toFixed(2)}`, 20, y);
      y += 10;
      doc.setFont("bold");
      doc.text(`Grand Total: Rs ${order.totalAmount.toFixed(2)}`, 20, y);
      doc.setFont("normal");
      y += 10;
      doc.text(
        `Payment Status: ${order.paymentStatus === "paid" ? "Paid" : "Unpaid"}`,
        20,
        y
      );
      y += 10;
      doc.text(
        `Payment Method: ${
          order.paymentMethod
            ? order.paymentMethod === "cod"
              ? "Cash on Delivery"
              : order.paymentMethod.charAt(0).toUpperCase() +
                order.paymentMethod.slice(1)
            : "N/A"
        }`,
        20,
        y
      );

      // Save the PDF
      doc.save(`invoice-${order.id}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate invoice");
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order || !customer) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Order Not Found
        </h1>
        <p className="text-white/70">Could not find the order with ID: {id}</p>
        <Button
          variant="outline"
          asChild
          className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
        >
          <Link href="/admin/dashboard/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="bg-white/5 border-white/20 text-white/80 hover:text-white hover:bg-white/10"
          >
            <Link href="/admin/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to orders</span>
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Order Details
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-green-600 text-white border-0 hover:bg-green-700 hover:text-white text-sm"
            onClick={handlePaymentSlipClick}
          >
            <FileText className="h-4 w-4" />
            Payment Slip
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-red-600 text-white border-0 hover:bg-red-700 hover:text-white text-sm"
            onClick={handleDownloadInvoice}
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Order and Customer Information */}
        <div className="space-y-6">
          {/* Order Information Card */}
          <Card className="bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg sm:text-xl">
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-md font-medium text-white/50">
                      Order ID:
                    </p>
                    <p className="text-md font-medium text-white/50">
                      Order Date:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-white/70">{order.id}</p>
                    <p className="font-medium text-white/70">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-md font-medium text-white/50">
                      Payment Status:
                    </p>
                    <p className="text-md font-medium text-white/50">
                      Payment Method:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-white/70">
                      {paymentStatus ? "Paid" : "Unpaid"}
                    </p>
                    <p className="font-medium text-white/70">
                      {order.paymentMethod
                        ? order.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : order.paymentMethod.charAt(0).toUpperCase() +
                            order.paymentMethod.slice(1)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-md font-medium text-white/50">
                      Order Status:
                    </p>
                    <p className="text-md font-medium text-white/50">
                      Quantity:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
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
                      {orderStatus.charAt(0).toUpperCase() +
                        orderStatus.slice(1)}
                    </Badge>
                    <p className="font-medium text-white/70">
                      {order.itemsCount} item
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <h3 className="font-semibold text-white mb-2 text-base sm:text-lg">
                    Products
                  </h3>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-start gap-3"
                      >
                        <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white/70 text-sm sm:text-base">
                            {item.name}
                          </p>
                          <div className="flex flex-col text-xs sm:text-sm text-white/50 mt-1">
                            <p>Rs {item.price.toFixed(2)} × {item.quantity}</p>
                            {item.size && (
                              <p className="text-white/50">
                                Size: {item.size.size || item.size.sizeId} (+Rs {item.size.price.toFixed(2)})
                              </p>
                            )}
                            {item.design && (
                              <p className="text-white/50">
                                Design: {item.design.title} (+Rs {item.design.price.toFixed(2)})
                              </p>
                            )}
                            {/* <p className="font-medium text-white/70 mt-1">
                              Total: Rs {(item.price * item.quantity).toFixed(2)}
                            </p> */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm sm:text-base">
                    <p className="text-white/50">Subtotal</p>
                    <p className="font-medium text-white/70">
                      Rs {order.subtotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <p className="text-white/50">Delivery Charge</p>
                    <p className="font-medium text-white/70">
                      Rs {order.shipping.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <p className="font-semibold text-white">Grand Total</p>
                    <p className="font-bold text-white">
                      Rs {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information Card */}
          <Card className="bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg sm:text-xl">
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={customer.image || "/placeholder.svg"}
                      alt={customer.name}
                    />
                    <AvatarFallback className="bg-purple-600">
                      {(customer.name || "").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white/50">Name</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white/70 text-sm sm:text-base">
                        {customer.name}
                      </p>
                      {customer.role === "admin" && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50">Phone</p>
                  <p className="font-medium text-white/70 text-sm sm:text-base">
                    {customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/50">Email</p>
                  <p className="font-medium text-white/70 text-sm sm:text-base">
                    {customer.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Status and Shipping */}
        <div className="space-y-6">
          {/* Order Status Card */}
          <Card className="bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg sm:text-xl">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white/50">
                  Change Order Status
                </p>
                <div className="mt-1">
                  <Select
                    value={orderStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/70 focus:ring-purple-500 text-sm sm:text-base">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950/90 border-white/10 text-white/70">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirm">Confirm</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="on the way">On the way</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="payment-status"
                  className="text-sm font-medium text-white/50"
                >
                  Payment Status
                </Label>
                <div className="flex items-center space-x-2">
                  <Label
                    htmlFor="payment-status"
                    className={
                      paymentStatus ? "text-green-400" : "text-red-400"
                    }
                  >
                    {paymentStatus ? "Paid" : "Unpaid"}
                  </Label>
                  <Switch
                    id="payment-status"
                    checked={paymentStatus}
                    onCheckedChange={handlePaymentStatusChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Details Card */}
          <Card className="bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg sm:text-xl">
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <div className="flex flex-row justify-between items-center mb-6">
                <p className="text-md font-medium text-white/50 mb-1">Name: </p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {order.shippingDetails.fullName}
                </p>
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
                <p className="text-md font-medium text-white/50 mb-1">Email:</p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {order.shippingDetails.email}
                </p>
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
                <p className="text-md font-medium text-white/50 mb-1">
                  Phone Number:
                </p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {order.shippingDetails.phone}
                </p>
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
              <p className="text-md font-medium text-white/50 mb-1">
                  Country:
              </p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {countryName}
                </p>
                
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
              <p className="text-md font-medium text-white/50 mb-1">
                  Province:
              </p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {provinceName}
                </p>
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
              <p className="text-md font-medium text-white/50 mb-1">
                  city:
              </p>
                <p className="text-md font-medium text-white/50 mb-1">
                  {cityName}
                </p>
              </div>
              <div className="flex flex-row justify-between items-center mb-6">
                <p className="text-md font-medium text-white/50 mb-1">
                  Address:
                </p>
                <p className="text-md text-white/70">
                  {order.shippingDetails.address}, {order.shippingDetails.city}
                  {order.shippingDetails.postalCode
                    ? `, ${order.shippingDetails.postalCode}`
                    : ""}
                </p>
              </div>
              {order.shippingDetails.locationUrl && (
                <a
                  href={order.shippingDetails.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline text-sm"
                >
                  View Location
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

