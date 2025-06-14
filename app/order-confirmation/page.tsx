"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { toast } from "sonner";
import { Box, Check, Clock, Package, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { ICheckout } from "@/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface OrderData {
  orderNumber: string;
  date: string;
  status: string;
  statusCode: number;
  items: { 
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
  }[];
  shipping: number;
  total: number;
  estimatedDelivery: string;
}

// Loading component to use as fallback
function OrderLoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
          className="rounded-lg mb-8 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-gray-300 to-indigo-300 opacity-90"></div>
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mx-auto bg-white rounded-full w-20 h-20 flex items-center justify-center mb-4"
            ></motion.div>
            <div className="h-8 bg-white/30 rounded w-2/3 mx-auto mb-2"></div>
            <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-300 to-gray-300"></div>
            <CardHeader className="pb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="space-y-3">
                  {[1, 2].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div >
  );
}

// Helper function to get status code for progress bar
function getStatusCode(status: string): number {
  const statusMap: { [key: string]: number } = {
    'pending': 12,
    'confirm': 28,
    'processing': 45,
    'pickup': 60,
    'on the way': 80,
    'delivered': 100
  };

  return statusMap[status.toLowerCase()] || 0;
}

// Order confirmation component with search params
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const { clearCart } = useCart();
  const hasShownToast = useRef(false);

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);

  useEffect(() => {
    if (status === "success" && !cartCleared && !hasShownToast.current) {
      hasShownToast.current = true;
      clearCart()
        .then(() => {
          toast.success("Order placed successfully!", {
            position: "bottom-right",
            duration: 5000,
          });
          setCartCleared(true);
        })
        .catch((err) => {
          console.error("Error clearing cart:", err);
          hasShownToast.current = false;
        });
    } else if (status === "pending_payment" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.info("Please complete the payment to confirm your order.", {
        position: "top-right",
        duration: 3000,
      });
    }
  }, [status, cartCleared, clearCart]);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/checkout?page=1&limit=10`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || `HTTP error: ${response.status}`
          );
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.details || "Error fetching orders");
        }

        const checkout = result.data.checkouts.find(
          (c: ICheckout) => c.id === orderId
        );

        if (!checkout) {
          throw new Error("Order not found in response");
        }

        const itemsSource = checkout.cartDetails?.items;

        const orderItems = Array.isArray(itemsSource)
          ? itemsSource.map((item: ICheckout["items"][number]) => ({
            name: item.name || "Unknown Item",
            price: item.price || 0,
            quantity: item.quantity || 1,
            image: item.image || "",
            size: item.size ? {
              ...('size' in item.size ? { size: item.size.size } : { sizeId: item.size.sizeId?.toString() }),
              price: item.size.price
            } : null,
            design: item.design
          }))
          : [];

        const order: OrderData = {
          orderNumber: checkout.id,
          date: new Date(checkout.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          status: checkout.status || "pending",
          statusCode: getStatusCode(checkout.status || "pending"),
          items: orderItems,
          shipping: checkout.shipping || 0,
          total: checkout.totalAmount || 0,
          estimatedDelivery: "May 12-14, 2025",
        };

        setOrderData(order);
      } catch (err: unknown) {
        console.error("Error fetching order:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load order details"
        );
        toast.error("Failed to load order details", {
          description: err instanceof Error ? err.message : String(err),
          position: "top-right",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-lg text-ivoryWhite"
        >
          Loading order details...
        </motion.p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error || "Order not found"}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="text-ivoryWhite" onClick={() => router.push("/shop")}>Return to Shop</Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  const getStatusMessage = () => {
    switch (orderData.status.toLowerCase()) {
      case 'pending':
        return "Order Received";
      case 'confirm':
        return "Order Confirmed!";
      case 'processing':
        return "Processing Order";
      case 'pickup':
        return "Ready for Pickup";
      case 'on the way':
        return "On the Way!";
      case 'delivered':
        return "Order Delivered";
      default:
        return "Order Received";
    }
  };
  const getStatusIcon = () => {
    switch (orderData.status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-10 w-10 text-yellow-500" />;
      case 'confirm':
        return <Check className="h-10 w-10 text-green-500" />;
      case 'processing':
        return <Package className="h-10 w-10 text-blue-500" />;
      case 'pickup':
        return <Box className="h-10 w-10 text-indigo-500" />;
      case 'on the way':
        return <Truck className="h-10 w-10 text-orange-500" />;
      case 'delivered':
        return <Check className="h-10 w-10 text-green-500" />;
      default:
        return <Check className="h-10 w-10 text-green-500" />;
    }
  };

  const statusStages = [
    { name: "Order Placed", icon: <Clock className="h-4 w-4" /> },
    { name: "Confirm", icon: <Check className="h-4 w-4" /> },
    { name: "Processing", icon: <Package className="h-4 w-4" /> },
    { name: "Pickup", icon: <Box className="h-4 w-4" /> },
    { name: "On the way", icon: <Truck className="h-4 w-4" /> },
    { name: "Delivered", icon: <Check className="h-4 w-4" /> },
  ];


  return (
    <>
      <Header />
      <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C]">
        <div className="w-full max-w-3xl md:mt-28">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg mb-8 p-8 text-center relative overflow-hidden border border-white/30 hover:border-white"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B1A1A] via-[#D4AF37] to-[#2A2A2A] opacity-90"></div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto bg-ivoryWhite rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-lg"
              >
                {getStatusIcon()}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-ivoryWhite mb-2"
              >
                {getStatusMessage()}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-ivoryWhite text-lg"
              >
                Thank you for your purchase
              </motion.p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 1 }}
                className="h-1 bg-[#F5F5DC]/30 mt-4 rounded-full"
              ></motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg overflow-hidden bg-deepGraphite border border-white/30 hover:border-white">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1 }}
                className="h-2 bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37]"
              ></motion.div>
              <CardHeader className="pb-4">
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-2xl text-ivoryWhite">Order Details</CardTitle>
                  <CardDescription className="text-ivoryWhite">
                    Order #{orderData.orderNumber} • Placed on {orderData.date}
                  </CardDescription>
                </motion.div>

              </CardHeader>

              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-medium text-lg mb-3 flex items-center text-ivoryWhite">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Items Ordered
                  </h3>
                  <div className="space-y-3">
                    {orderData.items.length > 0 ? (
                      orderData.items.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}

                          className="flex justify-between items-center p-3 rounded-lg transition-colors">
                          <div className="flex items-center gap-4">
                            {item.image ? (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative w-16 h-16"
                              >
                                <Image
                                  alt={item.name || "Product image"}
                                  src={item.image}
                                  width={80}
                                  height={80}
                                  className="object-cover rounded-md"
                                  onError={() =>
                                    console.error(
                                      `Failed to load image for ${item.name}`
                                    )
                                  }
                                />
                              </motion.div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-ivoryWhite text-sm">
                                  No Image
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-ivoryWhite">{item.name}</p>
                              <p className="text-sm text-ivoryWhite text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
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
                          <p className="font-medium text-ivoryWhite">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-ivoryWhite text-muted-foreground">
                        No items found in this order.
                      </p>
                    )}
                  </div>
                </motion.div>

                <Separator />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="font-medium text-lg text-ivoryWhite mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground text-ivoryWhite">Subtotal</p>
                      <p className="text-ivoryWhite">${(orderData.total - orderData.shipping).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground text-ivoryWhite">Shipping</p>
                      <p className="text-ivoryWhite">${orderData.shipping.toFixed(2)}</p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="flex justify-between font-medium text-lg pt-2"
                    >
                      <p className="text-ivoryWhite">Total</p>
                      <p className="text-ivoryWhite">${orderData.total.toFixed(2)}</p>
                    </motion.div>
                  </div>
                </motion.div>

                <Separator />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <h3 className="font-medium text-lg mb-3 flex items-center text-ivoryWhite">
                    <Package className="mr-2 h-5 w-5" />
                    Shipping Information
                  </h3>
                  <p className="text-muted-foreground text-ivoryWhite">
                    Estimated delivery: {orderData.estimatedDelivery}
                  </p>
                  <div className="mt-4 relative">
                    <Progress
                      value={orderData.statusCode}
                      className="h-2 bg-ivoryWhite"
                    />
                    <div className="flex justify-between text-xs mt-2">
                      {statusStages.map((stage, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className={`flex flex-col items-center ${index <= statusStages.findIndex(s => s.name.toLowerCase() === orderData.status.toLowerCase()) ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <div className="flex items-center justify-center text-himalayanRed w-8 h-8 rounded-full bg-ivoryWhite border-2 border-current mb-1">
                            {stage.icon}
                          </div>
                          <span className="text-center text-ivoryWhite">{stage.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </CardContent>

              {/* Card Footer with Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className="w-full sm:w-auto bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] hover:from-[#600000] hover:to-[#D4AF37]"
                      onClick={() => router.push("/track-order")}
                    >
                      Track Order
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full sm:w-auto bg-ivoryWhite text-charcoalBlack" asChild>
                      <Link href="/shop">Continue Shopping</Link>
                    </Button>
                  </motion.div>
                </CardFooter>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// Main component with Suspense
export default function OrderConfirmationClient() {
  return (
    <Suspense fallback={<OrderLoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
