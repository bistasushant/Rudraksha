"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, Package, Search, Truck, CheckCircle, MapPin, Clock, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface Order {
  id: string;
  date: string;
  items: number;
  total: string;
  status: string;
}

// Reusable Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { className: "bg-amber-100 text-amber-800", icon: <Clock className="h-4 w-4 mr-1" /> };
      case "confirm":
        return { className: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-4 w-4 mr-1" /> };
      case "processing":
        return { className: "bg-purple-100 text-purple-800", icon: <Package className="h-4 w-4 mr-1" /> };
      case "pickup":
        return { className: "bg-cyan-100 text-cyan-800", icon: <MapPin className="h-4 w-4 mr-1" /> };
      case "on the way":
        return { className: "bg-orange-100 text-orange-800", icon: <Truck className="h-4 w-4 mr-1" /> };
      case "delivered":
        return { className: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4 mr-1" /> };
      default:
        return { className: "bg-gray-100 text-gray-800", icon: null };
    }
  };

  const { className, icon } = getBadgeProps(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className} transition-colors`}>
      {icon}
      {status}
    </span>
  );
};

// Reusable Order Card Component
const OrderCard = ({ order, index }: { order: Order; index: number }) => {
  const router = useRouter();

  const handleViewOrder = (order: Order) => {
    if (!order.id) {
      toast.error("Invalid order ID");
      return;
    }
  
    router.push(`/dashboard/order-history/${order.id}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-center p-3 sm:p-4 hover:bg-amber-100/10 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="font-medium text-ivoryWhite dark:text-gray-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-[#D4AF37] text-white text-base sm:text-lg font-bold">
          {index + 1}
        </span>
      </div>
      <div className="text-sm sm:text-base text-[#F5F5DC]/80 dark:text-gray-400">{order.date}</div>
      <div className="text-sm sm:text-base text-[#F5F5DC]/80 dark:text-gray-400">{order.items} items</div>
      <div className="text-sm sm:text-base text-ivoryWhite dark:text-gray-100">{order.total}</div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <StatusBadge status={order.status} />
        <Button
          onClick={() => handleViewOrder(order)}
          aria-label={`View order ${index + 1}`}
          className="flex items-center px-2 sm:px-3 py-1 bg-ivoryWhite dark:bg-gray-800 border border-[#D4AF37] dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:hover:bg-indigo-900 transition-colors hover:bg-[#D4AF37] cursor-pointer text-xs sm:text-sm"
        >
          <Eye className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span className="ml-1.5 sm:ml-2">View</span>
        </Button>
      </div>
    </div>
  );
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const [statusFilter, setStatusFilter] = useState("all");
  const { isAuthenticated } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !token) {
        setError("Please log in to view your order history");
        return;
      }

      setError(null);
      try {
        // Determine which endpoint to use based on role
        const endpoint = userRole === "admin" ? "/api/admin/orders" : "/api/customer/history";
        const url = new URL(endpoint, window.location.origin);
        
        if (debouncedSearchQuery) url.searchParams.append("search", debouncedSearchQuery);
        if (statusFilter && statusFilter !== "all") url.searchParams.append("status", statusFilter);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const data = await res.json();
        if (!data.error && data.data && data.data.orders) {
          console.log('Fetched orders:', data.data.orders);
          setOrders(data.data.orders);
        } else {
          const errorMessage = data.message || "Failed to fetch orders";
          setError(errorMessage);
          toast.error(errorMessage);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError("Failed to fetch orders");
        toast.error("Failed to fetch orders");
        setOrders([]);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, debouncedSearchQuery, statusFilter, userRole]);

  // Memoized filtered orders
  const filteredOrders = useMemo(() => ({
    pending: orders.filter((order) => order.status.toLowerCase() === "pending"),
    confirm: orders.filter((order) => order.status.toLowerCase() === "confirm"),
    processing: orders.filter((order) => order.status.toLowerCase() === "processing"),
    pickup: orders.filter((order) => order.status.toLowerCase() === "pickup"),
    ontheway: orders.filter((order) => order.status.toLowerCase() === "on the way"),
    delivered: orders.filter((order) => order.status.toLowerCase() === "delivered"),
  }), [orders]);

  // Add a message for admin users
  if (userRole === "admin") {
    return (
      <div className="h-full">
        <div className="relative max-w-7xl mx-auto py-12 px-4 md:py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#B87333] to-[#D4AF37] rounded-2xl shadow-xl shadow-[#D4AF37]/25 mb-6">
              <Package className="h-10 w-10 text-ivoryWhite" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-[#8B1A1A] via-[#B87333] to-[#F5F5DC] bg-clip-text text-transparent mb-4 tracking-tight">
              Admin Order History
            </h1>
            <p className="text-xl text-ivoryWhite max-w-2xl mx-auto leading-relaxed">
              View and manage orders placed by you (admin)
            </p>
          </div>
          {/* Rest of the component remains the same */}
        </div>
      </div>
    );
  }

  if (error || !isAuthenticated || !token) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-2 mx-auto max-w-2xl">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error || "Please log in to view your order history"}
      </div>
    );
  }

  const tabData = [
    { value: "pending", label: "Pending", count: filteredOrders.pending.length, icon: Clock, color: "amber" },
    { value: "confirm", label: "Confirmed", count: filteredOrders.confirm.length, icon: CheckCircle, color: "blue" },
    { value: "processing", label: "Processing", count: filteredOrders.processing.length, icon: Package, color: "purple" },
    { value: "pickup", label: "Pickup", count: filteredOrders.pickup.length, icon: MapPin, color: "cyan" },
    { value: "ontheway", label: "On the Way", count: filteredOrders.ontheway.length, icon: Truck, color: "orange" },
    { value: "delivered", label: "Delivered", count: filteredOrders.delivered.length, icon: CheckCircle, color: "green" },
  ];

  return (
    <div className="h-full">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-brassGold rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-himalayanRed rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-antiqueCopper rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-12 px-4 md:py-20">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#B87333] to-[#D4AF37] rounded-2xl shadow-xl shadow-[#D4AF37]/25 mb-6 transform hover:scale-110 transition-transform duration-300">
            <Package className="h-10 w-10 text-ivoryWhite" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-[#8B1A1A] via-[#B87333] to-[#F5F5DC] bg-clip-text text-transparent mb-4 tracking-tight">
            Order History
          </h1>
          <p className="text-xl text-ivoryWhite max-w-2xl mx-auto leading-relaxed">
            Track your orders with real-time updates and beautiful insights
          </p>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="mb-12">
          <div className="backdrop-blur-sm bg-[#2A2A2A]/70 border border-[#B87333]/30 hover:border-[#B87333] rounded-3xl p-4 sm:p-8 shadow-2xl shadow-[#D4AF37]/10">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brassGold" />
                <input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-12 pr-4 py-3 sm:py-4 w-full bg-[#2A2A2A]/80 border border-[#D4AF37] rounded-2xl focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all duration-300 text-ivoryWhite placeholder-ivoryWhite shadow-lg"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                  aria-label="Search orders"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-[#2A2A2A]/80 border border-[#D4AF37] rounded-2xl focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all duration-300 text-ivoryWhite shadow-lg min-w-[160px]"
                aria-label="Filter by status"
              >
                <option value="all" className="bg-deepGraphite">All Status</option>
                <option value="pending" className="bg-deepGraphite">Pending</option>
                <option value="confirm" className="bg-deepGraphite">Confirmed</option>
                <option value="processing" className="bg-deepGraphite">Processing</option>
                <option value="pickup" className="bg-deepGraphite">Pickup</option>
                <option value="ontheway" className="bg-deepGraphite">On the Way</option>
                <option value="delivered" className="bg-deepGraphite">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-antiqueCopper rounded-3xl mb-6">
              <ShoppingBag className="h-12 w-12 text-ivoryWhite" />
            </div>
            <h3 className="text-2xl font-bold text-ivoryWhite mb-2">No orders found</h3>
            <p className="text-ivoryWhite">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            {/* Enhanced Tab Navigation */}
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-3 mb-4 sm:mb-12 bg-transparent p-0">
              {tabData.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="group flex items-center justify-center gap-1 sm:gap-3 px-1.5 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-2xl text-[10px] sm:text-sm font-semibold transition-all duration-300 bg-[#F5F5DC]/70 hover:bg-[#F5F5DC]/90 border border-white/20 hover:border-[#D4AF37] text-gray-700 hover:text-[#D4AF37] shadow-lg hover:shadow-xl hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B1A1A] data-[state=active]:to-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-[#D4AF37]/25 whitespace-nowrap"
                >
                  <tab.icon className="h-3 sm:h-4 w-3 sm:w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="truncate">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 text-[9px] sm:text-xs font-bold rounded-full bg-purple-100 text-purple-800 px-1 sm:px-2 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Enhanced Tab Content */}
            {[
              { value: "pending", title: "Pending Orders", desc: "Orders awaiting confirmation", orders: filteredOrders.pending, gradient: "from-[#B87333] to-[#D4AF37]" },
              { value: "confirm", title: "Confirmed Orders", desc: "Orders that have been confirmed", orders: filteredOrders.confirm, gradient: "from-blue-500 to-cyan-500" },
              { value: "processing", title: "Processing Orders", desc: "Orders being prepared", orders: filteredOrders.processing, gradient: "from-purple-500 to-indigo-500" },
              { value: "pickup", title: "Ready for Pickup", desc: "Orders ready to collect", orders: filteredOrders.pickup, gradient: "from-cyan-500 to-teal-500" },
              { value: "ontheway", title: "On The Way", desc: "Orders in transit", orders: filteredOrders.ontheway, gradient: "from-orange-500 to-red-500" },
              { value: "delivered", title: "Delivered Orders", desc: "Successfully completed orders", orders: filteredOrders.delivered, gradient: "from-green-500 to-emerald-500" },
            ].map((section) => (
              <TabsContent key={section.value} value={section.value} className="mt-18 sm:mt-0">
                <div className="backdrop-blur-sm bg-[#2A2A2A]/70 border border-white/20 rounded-xl sm:rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden">
                  {/* Section Header */}
                  <div className={`bg-gradient-to-r ${section.gradient} p-2.5 sm:p-8 text-ivoryWhite`}>
                    <h3 className="text-sm sm:text-2xl text-ivoryWhite font-bold mb-1 sm:mb-2">{section.title}</h3>
                    <p className="text-[10px] sm:text-base text-ivoryWhite">{section.desc} • {section.orders.length} orders</p>
                  </div>

                  {section.orders.length === 0 ? (
                    <div className="text-center py-3 sm:py-16 text-gray-600">
                      <div className="inline-flex items-center justify-center w-8 sm:w-16 h-8 sm:h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl sm:rounded-2xl mb-2 sm:mb-4">
                        <Package className="h-4 sm:h-8 w-4 sm:w-8 text-ivoryWhite" />
                      </div>
                      <p className="text-xs sm:text-lg text-ivoryWhite font-medium">No orders in this category</p>
                    </div>
                  ) : (
                    <div className="p-2 sm:p-8 space-y-2 sm:space-y-4">
                      {section.orders.map((order, index) => (
                        <div
                          key={order.id}
                          style={{ animationDelay: `${index * 100}ms` }}
                          className="animate-fade-in"
                        >
                          <OrderCard order={order} index={index} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}