"use client";
import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import DialogBox from "@/components/DialogBox";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  cartEnglishTexts,
  cartChineseTexts,
  cartHindiTexts,
  cartNepaliTexts,
} from "@/language";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: {
    size: string;
    price: number;
  };
  design?: {
    title: string;
    price: number;
  };
}

export default function CartPage() {
  const router = useRouter();
  const { selectedLanguage } = useLanguage();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { cartItems, removeItem, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>({});
  const cartTexts =
    selectedLanguage === "chinese"
      ? cartChineseTexts
      : selectedLanguage === "hindi"
        ? cartHindiTexts
        : selectedLanguage === "nepali"
          ? cartNepaliTexts
          : cartEnglishTexts;
  const handleConfirmRemove = () => {
    if (itemToRemove) removeItem(itemToRemove);
    setIsDialogVisible(false);
  };
  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1 || loadingItems[id]) return;
    
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    
    try {
      await updateQuantity(id, newQuantity);
    } finally {
      setLoadingItems(prev => ({ ...prev, [id]: false }));
    }
  };
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Show toast notification
      toast.error(cartTexts.loginRequired || "Login Required", {
        description:
          cartTexts.loginToCheckout || "You must be logged in to checkout",
      });
      // Redirect to login page
      router.push("/auth/login");
      return;
    }
    // If authenticated, proceed to checkout
    router.push("/checkout");
  };
  // Function to format currency based on selectedCurrency
  const formatCurrency = (amount: number) => {
    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      CNY: "¥",
      INR: "₹",
      NPR: "रु",
    };
    // Convert amount to selected currency
    const convertedAmount = amount * (exchangeRates[selectedCurrency] || 1);
    // Get currency symbol or default to the currency code
    const symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    return `${symbol}${'\u00A0'}${convertedAmount.toFixed(2)}`;
  };
  // Calculate item total including size and design prices
  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.price;
    const sizePrice = item.size?.price || 0;
    const designPrice = item.design?.price || 0;
    return (basePrice + sizePrice + designPrice) * item.quantity;
  };
  // Calculate cart subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };
  const subtotal = calculateSubtotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;
  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C]">
        <div className="container mx-auto px-4 py-8 flex-grow mt-28">
          {cartItems.length === 0 ? (
            <div className="text-center mt-8">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-ivoryWhite" />
                <h1 className="text-2xl text-ivoryWhite font-bold mb-4">{cartTexts.h1}</h1>
                <Button asChild>
                  <Link
                    href="/shop"
                    className="text-xl bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] text-ivoryWhite py-5 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#B87333]"
                  >
                    {cartTexts.h2}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="lg:w-2/3 space-y-4 md:space-y-6">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-deepGraphite rounded-lg shadow-md p-4 md:p-6  border border-[#B87333]/30 hover:border-[#B87333]"
                  >
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start">
                      {/* Product Info */}
                      <div className="md:col-span-6 flex items-start space-x-4 w-full">
                        <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/product/${item.id}`}
                            className="font-medium text-ivoryWhite line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <div className="space-y-1 mt-1">
                            <p className="text-ivoryWhite">
                              Base Price: {formatCurrency(item.price)}
                            </p>
                            {item.size && item.size.size && item.size.price > 0 && (
                              <p className="text-sm text-[#D4AF37]">
                                Size: {item.size.size} (+{formatCurrency(item.size.price)})
                              </p>
                            )}
                            {item.design && item.design.title && item.design.price > 0 && (
                              <p className="text-sm text-[#D4AF37]">
                                Design: {item.design.title} (+{formatCurrency(item.design.price)})
                              </p>
                            )}
                            <p className="text-ivoryWhite font-medium">
                              Total: {formatCurrency(item.price + (item.size?.price || 0) + (item.design?.price || 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Quantity Controls */}
                      <div className="md:col-span-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 justify-between md:justify-center">
                          <Button
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10 text-ivoryWhite bg-deepGraphite border border-[#B87333]/30 hover:border-[#B87333] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || loadingItems[item.id]}
                          >
                            -
                          </Button>
                          <Input
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 md:w-20 text-center text-ivoryWhite h-8 md:h-10 border border-[#B87333]/30 hover:border-[#B87333]"
                            min="1"
                            disabled={loadingItems[item.id]}
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10 bg-deepGraphite text-ivoryWhite border border-[#B87333]/30 hover:border-[#B87333] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={loadingItems[item.id]}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      {/* Price and Remove */}
                      <div className="md:col-span-3 w-full flex items-center justify-between md:justify-end">
                        <p className="font-medium text-ivoryWhite md:text-right">
                          {formatCurrency(calculateItemTotal(item))}
                        </p>
                        <Button
                          size="sm"
                          className="text-red-500 hover:text-red-700 ml-2 bg-deepGraphite"
                          onClick={() => {
                            setItemToRemove(item.id);
                            setIsDialogVisible(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 md:mr-1" />
                          <span className="sr-only md:not-sr-only">
                            {cartTexts.h3}
                          </span>
                        </Button>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </motion.div>
                ))}
              </div>
              {/* Order Summary */}
              <div className="lg:w-1/3 border rounded-lg border-[#B87333]/30 hover:border-[#B87333]">
                <div className="bg-deepGraphite rounded-lg shadow-md p-4 md:p-6 lg:sticky lg:top-24">
                  <h2 className="text-lg md:text-xl text-ivoryWhite font-bold mb-4">
                    {cartTexts.h3}
                  </h2>
                  <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                    <div className="flex justify-between text-sm md:text-base text-ivoryWhite">
                      <span>{cartTexts.subtotal}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    <Separator />
                    <div className="flex justify-between font-bold text-lg md:text-xl text-ivoryWhite">
                      <span>{cartTexts.total}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full text-sm md:text-base bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    onClick={handleCheckout}
                  >
                    {cartTexts.h5}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogBox
            isVisible={isDialogVisible}
            message={cartTexts.h6}
            onClose={() => setIsDialogVisible(false)}
            onConfirm={handleConfirmRemove}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
