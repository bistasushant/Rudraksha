"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { faRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, ShoppingCart, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const Stats = () => {
  const { admin, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState(admin?.name || "Guest");
  const [productCount, setProductCount] = useState(0);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [newCustomersCount, setNewCustomersCount] = useState(0);
  const [orderStats, setOrderStats] = useState<{
    totalOrders: number;
    percentageChange: number;
  } | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchProductCount = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view products.");
      setLoadingProducts(false);
      return;
    }
    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products/stats", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products count");
      }
      const result = await response.json();
      setProductCount(result.data.total || 0);
      setNewProductsCount(result.data.newProductsCount || 0);
    } catch (error) {
      console.error("Error fetching products count:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load products count.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [admin]);

  const fetchCustomerCount = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view customers.");
      setLoadingCustomers(false);
      return;
    }
    try {
      setLoadingCustomers(true);
      const response = await fetch("/api/customer/customer-count", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch customers count");
      }
      const result = await response.json();
      console.log(result)
      setCustomerCount(result.data?.totalCustomersCount || 0);
      setNewCustomersCount(result.data?.newCustomersCount || 0);
    } catch (error) {
      console.error("Error fetching customers count:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load customers count.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, [admin]);

  const fetchOrderStats = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view orders.");
      setLoadingOrders(false);
      return;
    }
    try {
      setLoadingOrders(true);
      const response = await fetch("/api/order/stats", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch orders stats");
      }
      const result = await response.json();
      setOrderStats({
        totalOrders: result.data.totalOrders || 0,
        percentageChange: result.data.percentageChange || 0,
      });
    } catch (error) {
      console.error("Error fetching orders stats:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load orders stats.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoadingOrders(false);
    }
  }, [admin]);

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayName(admin.name);
      fetchProductCount();
      fetchCustomerCount();
      fetchOrderStats();
    } else if (!isLoading && !admin) {
      setDisplayName("Guest");
      setLoadingProducts(false);
      setLoadingCustomers(false);
      setLoadingOrders(false);
    }
  }, [
    admin,
    isLoading,
    fetchProductCount,
    fetchCustomerCount,
    fetchOrderStats,
  ]);

  return (
    <div className="grid gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-white/70">
          Welcome back, {isLoading ? "Loading..." : displayName}! Here&apos;s
          what&apos;s happening with your store today.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Total Revenue
            </CardTitle>
            <FontAwesomeIcon
              icon={faRupeeSign}
              className="h-6 w-6 text-purple-400"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">Rs 45,231</div>
            <p className="text-sm text-white/70">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Orders
            </CardTitle>
            <ShoppingCart className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {loadingOrders ? "Loading..." : orderStats?.totalOrders || 0}
            </div>
            <p className="text-sm text-white/70">
              {loadingOrders
                ? "Loading..."
                : orderStats?.percentageChange !== undefined &&
                  orderStats.percentageChange >= 0
                  ? `+${orderStats.percentageChange}% from last month`
                  : `${orderStats?.percentageChange || 0}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Products
            </CardTitle>
            <Box className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {loadingProducts ? "Loading..." : productCount}
            </div>
            <p className="text-sm text-white/70">
              {loadingProducts
                ? "Loading..."
                : `+${newProductsCount} new this month`}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Total Customers
            </CardTitle>
            <Users className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {loadingCustomers ? "Loading..." : customerCount}
            </div>
            <p className="text-sm text-white/70">
              {loadingCustomers
                ? "Loading..."
                : `+${newCustomersCount} since last week`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
