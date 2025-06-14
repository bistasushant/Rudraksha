"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, MapPin, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft, ExternalLink } from "lucide-react";
import { ApiResponse } from "@/types";
import Image from "next/image";
import { motion } from "framer-motion";

// Define Item type for better type safety
interface Item {
  name: string;
  quantity: number;
  price: number;
  image: string;
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
}

interface OrderDetail {
  id: string;
  date: string;
  status: string;
  statusCode: number;
  shipping: number;
  totalAmount: number;
  itemsCount: number;
  items: Item[];
  estimatedDelivery: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    countryId: string;
    provinceId: string;
    cityId: string;
    country?: string;
    province?: string;
    city?: string;
    postalCode?: string;
    locationUrl?: string;
  };
  paymentDetails: {
    method: string;
    status: string;
  };
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    rotateX: 5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      delay: 0.5
    }
  })
};

// Enhanced StatusBadge component with animations
const StatusBadge = ({ status }: { status: string }) => {
  const getBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { 
          className: "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30", 
          icon: <Clock className="h-4 w-4 mr-2" /> 
        };
      case "confirm":
        return { 
          className: "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30", 
          icon: <CheckCircle className="h-4 w-4 mr-2" /> 
        };
      case "processing":
        return { 
          className: "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30", 
          icon: <Package className="h-4 w-4 mr-2" /> 
        };
      case "pickup":
        return { 
          className: "bg-gradient-to-r from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-500/30", 
          icon: <MapPin className="h-4 w-4 mr-2" /> 
        };
      case "on the way":
        return { 
          className: "bg-gradient-to-r from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/30", 
          icon: <Truck className="h-4 w-4 mr-2" /> 
        };
      case "delivered":
        return { 
          className: "bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg shadow-green-500/30", 
          icon: <CheckCircle className="h-4 w-4 mr-2" /> 
        };
      default:
        return { 
          className: "bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg", 
          icon: null 
        };
    }
  };

  const { className, icon } = getBadgeProps(status);
  
  return (
    <motion.span 
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${className} backdrop-blur-sm`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      {icon}
      {status}
    </motion.span>
  );
};

export default function OrderDetail() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationNames, setLocationNames] = useState<{
    country?: string;
    province?: string;
    city?: string;
  }>({});
  const { id } = useParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get token and role from localStorage after component mounts
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    setToken(storedToken);
    setUserRole(storedRole);
  }, []);

  useEffect(() => {
    const fetchLocationNames = async (countryId: string, provinceId: string, cityId: string) => {
      try {
        const [countryRes, provinceRes, cityRes] = await Promise.all([
          fetch(`/api/country/${countryId}`),
          fetch(`/api/province/${provinceId}`),
          fetch(`/api/city/${cityId}`)
        ]);

        const [countryData, provinceData, cityData] = await Promise.all([
          countryRes.json(),
          provinceRes.json(),
          cityRes.json()
        ]);

        setLocationNames({
          country: countryData.data?.name || 'Unknown Country',
          province: provinceData.data?.name || 'Unknown Province',
          city: cityData.data?.name || 'Unknown City'
        });
      } catch (error) {
        console.error('Error fetching location names:', error);
        setLocationNames({
          country: 'Unknown Country',
          province: 'Unknown Province',
          city: 'Unknown City'
        });
      }
    };

    const fetchOrderDetails = async () => {
      // Wait for token to be loaded
      if (token === null) {
        return; // Still loading token
      }

      if (!token) {
        toast.error("Please log in to view order details");
        router.push("/");
        return;
      }

      if (!id) {
        toast.error("Invalid order ID");
        router.push("/order-history");
        return;
      }

      try {
        console.log("Fetching order details for ID:", id);
        // Determine which endpoint to use based on role
        const endpoint = userRole === "admin" ? `/api/admin/orders/${id}` : `/api/customer/history/${id}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        console.log(data);
        if (data.error) {
          throw new Error(data.message);
        }

        console.log("Order details received:", data.data.order);
        setOrder(data.data.order);

        // Fetch location names if IDs are available
        if (data.data.order?.customerDetails?.countryId && 
            data.data.order?.customerDetails?.provinceId && 
            data.data.order?.customerDetails?.cityId) {
          await fetchLocationNames(
            data.data.order.customerDetails.countryId,
            data.data.order.customerDetails.provinceId,
            data.data.order.customerDetails.cityId
          );
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error(error instanceof Error ? error.message : "Failed to fetch order details");
        router.push("/order-history");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, token, router, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div 
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full"></div>
          <motion.div 
            className="absolute inset-2 w-12 h-12 border-4 border-[#B87333]/30 border-b-[#B87333] rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="w-24 h-24 bg-gradient-to-r from-[#D4AF37] to-[#B87333] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/25"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8 }}
          >
            <ShoppingBag className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">Order Not Found</h2>
          <p className="text-gray-300 mb-8">The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <motion.button
            onClick={() => router.push("/dashboard/order-history")}
            className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B87333] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Order History
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Map status to progress percentage
  const getStatusProgress = (status: string): number => {
    switch (status.toLowerCase()) {
      case "pending": return 20;
      case "confirm": return 40;
      case "processing": return 60;
      case "pickup": return 80;
      case "on the way": return 90;
      case "delivered": return 100;
      default: return 0;
    }
  };

  const statusProgress = getStatusProgress(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-[#D4AF37]/20 to-[#B87333]/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-[#8B1A1A]/20 to-[#D4AF37]/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#B87333]/15 to-[#D4AF37]/15 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-[#B87333] to-[#D4AF37] rounded-3xl shadow-2xl shadow-[#D4AF37]/30 mb-8"
            whileHover={{ 
              scale: 1.1, 
              rotate: 360,
              boxShadow: "0 25px 50px -12px rgba(212, 175, 55, 0.5)"
            }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Package className="h-12 w-12 text-white" />
          </motion.div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-[#D4AF37] to-white bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Order Details
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Order placed on {order.date}
          </motion.p>
        </motion.div>

        {/* Order Status Card */}
        <motion.div 
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden relative"
          variants={cardVariants}
          whileHover="hover"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-[#B87333]/5 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <StatusBadge status={order.status} />
              <motion.div 
                className="text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                Estimated Delivery: {order.estimatedDelivery}
              </motion.div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B87333] rounded-full shadow-lg"
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                  custom={statusProgress}
                />
              </div>
              <motion.div 
                className="absolute -top-1 bg-white w-6 h-6 rounded-full shadow-lg border-2 border-[#D4AF37]"
                style={{ left: `calc(${statusProgress}% - 12px)` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Order Items */}
            <motion.div 
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden relative"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Order Items</h2>
                <div className="space-y-6">
                  {order.items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                    >
                      <div className="flex items-center gap-6">
                        <motion.div 
                          className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80} 
                            height={80} 
                            className="object-contain w-full h-full"
                          />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                          <p className="text-gray-300">Quantity: {item.quantity || 0}</p>
                          {item.size && (
                            <p className="text-sm text-[#D4AF37]">
                              Size: {item.size.size || item.size.sizeId} (+${item.size.price.toFixed(2)})
                            </p>
                          )}
                          {item.design && (
                            <p className="text-sm text-[#D4AF37]">
                              Design: {item.design.title} (+${item.design.price.toFixed(2)})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-[#D4AF37]">${(item.price || 0).toFixed(2)}</p>
                        {/* <p className="text-sm text-gray-300">Total: ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p> */}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div 
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden relative"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B87333]/5 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Order Summary</h2>
                <div className="space-y-6">
                  <motion.div 
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5"
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <span className="text-lg text-gray-300">Subtotal</span>
                    <span className="text-lg font-semibold text-white">${(order.subtotal || 0).toFixed(2)}</span>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5"
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <span className="text-lg text-gray-300">Shipping</span>
                    <span className="text-lg font-semibold text-white">${(order.shipping || 0).toFixed(2)}</span>
                  </motion.div>
                  <div className="border-t border-white/20 pt-6">
                    <motion.div 
                      className="flex justify-between items-center p-6 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-[#B87333]/10 border border-[#D4AF37]/30"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-2xl font-bold text-white">Total</span>
                      <span className="text-2xl font-bold text-[#D4AF37]">${(order.totalAmount || 0).toFixed(2)}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Customer Details */}
            <motion.div 
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden relative"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Shipping Details</h2>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    { label: "Name", value: order.customerDetails.name || 'Not provided' },
                    { label: "Email", value: order.customerDetails.email || 'Not provided' },
                    { label: "Phone", value: order.customerDetails.phone || 'Not provided' },
                    { label: "Address", value: order.customerDetails.address || 'Not provided' },
                    { 
                      label: "Location", 
                      value: order.customerDetails.cityId ? 
                        `${locationNames.city}, ${locationNames.province}, ${locationNames.country}` : 
                        'Not provided' 
                    },
                    { label: "Postal Code", value: order.customerDetails.postalCode || 'Not provided' }
                  ].map((detail, index) => (
                    <motion.div
                      key={index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-sm text-gray-400 mb-1">{detail.label}</p>
                      <p className="text-lg font-medium text-white">{detail.value}</p>
                    </motion.div>
                  ))}
                  {order.customerDetails.locationUrl && (
                    <motion.div
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-sm text-gray-400 mb-1">Location URL</p>
                      <motion.a 
                        href={order.customerDetails.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-lg font-medium text-[#D4AF37] hover:text-[#B87333] transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        View on Map
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </motion.a>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Payment Details */}
            <motion.div 
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden relative"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B87333]/5 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Payment Details</h2>
                <div className="grid grid-cols-1 gap-6">
                  <motion.div
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm text-gray-400 mb-2">Payment Method</p>
                    <p className="text-xl font-semibold text-white capitalize">
                      {order.paymentDetails.method === 'cod' ? 'Cash on Delivery' : order.paymentDetails.method || 'Not provided'}
                    </p>
                  </motion.div>
                  <motion.div
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm text-gray-400 mb-2">Payment Status</p>
                    <p className="text-xl font-semibold text-[#D4AF37] capitalize">{order.paymentDetails.status || 'Not provided'}</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Back Button */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <motion.button
            onClick={() => router.push("/dashboard/order-history")}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B87333] text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(212, 175, 55, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Back to Order History
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}