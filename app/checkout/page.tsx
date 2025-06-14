"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCurrency } from "@/context/currency-context";
import {
  Check,
  ChevronRight,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  User,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Country {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
  countryId: string;
}

interface City {
  id: string;
  name: string;
  provinceId: string;
  shippingCost: number;
}


const parseMapUrl = (url: string): { lat: string; lng: string } | null => {
  if (!url.trim()) return null;

  try {
    const urlObj = new URL(url);

    // Google Maps formats
    if (urlObj.hostname.includes("google.com")) {
      // Format: @lat,lng,zoom
      const pathMatch = urlObj.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (pathMatch) return { lat: pathMatch[1], lng: pathMatch[2] };

      // Format: ?q=lat,lng
      const queryMatch = urlObj.search.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (queryMatch) return { lat: queryMatch[1], lng: queryMatch[2] };

      // Format: ?ll=lat,lng
      const llMatch = urlObj.search.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llMatch) return { lat: llMatch[1], lng: llMatch[2] };
    }

    // Apple Maps format
    if (urlObj.hostname.includes("apple.com")) {
      const llMatch = urlObj.search.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llMatch) return { lat: llMatch[1], lng: llMatch[2] };
    }

    // OpenStreetMap formats
    if (urlObj.hostname.includes("openstreetmap.org")) {
      const mlat = urlObj.searchParams.get("mlat");
      const mlon = urlObj.searchParams.get("mlon");
      if (mlat && mlon) return { lat: mlat, lng: mlon };

      const hashMatch = urlObj.hash.match(/#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/);
      if (hashMatch) return { lat: hashMatch[1], lng: hashMatch[2] };
    }

    return null;
  } catch (error) {
    console.error("Error parsing map URL:", error);
    return null;
  }
};

export default function Checkout() {
  const { cartItems, totalPrice, clearCart, cartId } = useCart();
  const { selectedCurrency, exchangeRates } = useCurrency();
  const { userId, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isFetchingProvinces, setIsFetchingProvinces] = useState(false);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  // Form field states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationUrl, setLocationUrl] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    lat: string;
    lng: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    null
  );
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  // Form validation state
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    locationUrl?: string;
    country?: string;
    province?: string;
    city?: string;
    paymentType?: string;
  }>({});

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/country", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const result = await response.json();

        // Extract countries array from the nested structure
        if (response.ok && !result.error && Array.isArray(result.data.countries)) {
          setCountries(result.data.countries);
        } else {
          console.error("Invalid countries data:", result);
          toast.error("Failed to fetch countries.", {
            description: "Invalid data format received",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast.error("Failed to fetch countries. Please try again.");
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      setProvinces([]);
      setCities([]);
      setSelectedProvince("");
      setSelectedCity("");
      setShippingCost(0);
      return;
    }
    const fetchProvinces = async () => {
      setIsFetchingProvinces(true);
      try {
        const response = await fetch(`/api/province?countryId=${selectedCountry}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const result = await response.json();

        if (response.ok && !result.error && Array.isArray(result.data.provinces)) {
          setProvinces(result.data.provinces);
        } else {
          console.error("Invalid provinces data:", result);
          toast.error("Failed to fetch provinces.", {
            description: "Invalid data format received",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
        toast.error("Failed to fetch provinces. Please try again.");
      } finally {
        setIsFetchingProvinces(false);
      }
    };
    fetchProvinces();
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setSelectedCity("");
      setShippingCost(0);
      return;
    }

    const fetchCities = async () => {
      setIsFetchingCities(true);
      try {
        const response = await fetch(`/api/city?provinceId=${selectedProvince}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const result = await response.json();

        if (response.ok && !result.error && Array.isArray(result.data.cities)) {
          setCities(result.data.cities);
        } else {
          console.error("Invalid cities data:", result);
          toast.error("Failed to fetch cities.", {
            description: "Invalid data format received",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to fetch cities. Please try again.");
      } finally {
        setIsFetchingCities(false);
      }
    };

    fetchCities();
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      const city = cities.find((c) => c.id === selectedCity);
      if (city && city.shippingCost) {
        setShippingCost(city.shippingCost);
      } else {
        setShippingCost(0);
      }
    } else {
      setShippingCost(0);
    }
  }, [selectedCity, cities]);

  const formatCurrency = (amount: number): string => {
    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      CNY: "¥",
      INR: "₹",
      NPR: "रु",
    };
    const convertedAmount = amount * (exchangeRates[selectedCurrency] || 1);
    const symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    return `${symbol}${convertedAmount.toFixed(2)}`;
  };

  // Calculate subtotal including size and design prices
  const subtotal = cartItems.reduce((total, item) => {
    const basePrice = item.price;
    const sizePrice = item.size?.price || 0;
    const designPrice = item.design?.price || 0;
    const itemTotal = (basePrice + sizePrice + designPrice) * item.quantity;
    return total + itemTotal;
  }, 0);

  const total = subtotal + shippingCost;

  const handleLocationUrlChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const url = e.target.value.trim();
    setLocationUrl(url);
    setCoordinates(null);
    setLocationError(null);
    if (url) {
      const parsed = parseMapUrl(url);
      if (parsed) {
        setCoordinates(parsed);
      } else {
        setLocationError(
          "Invalid map URL. Please provide a valid Google Maps, Apple Maps, or OpenStreetMap link."
        );
      }
    }
  };

  const handleViewLocation = () => {
    if (coordinates) {
      const googleMapsUrl = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},15z`;
      window.open(googleMapsUrl, "_blank");
    } else if (locationUrl) {
      window.open(locationUrl, "_blank");
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{8,}$/.test(phone)) {
      errors.phone = "Invalid phone number";
    }

    if (!address.trim()) errors.address = "Address is required";
    if (!selectedCountry) errors.country = "Please select a country";
    if (!selectedProvince) errors.province = "Please select a province";
    if (!selectedCity) errors.city = "Please select a city";
    if (!selectedPaymentType) errors.paymentType = "Please select a payment method";

    if (locationUrl && !coordinates) {
      errors.locationUrl = "Invalid location URL format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with improved error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to continue with checkout");
      router.push("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare order data with all required fields
      const orderData = {
        customerId: userId,
        cartId,
        shippingDetails: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim().startsWith("+") ? phone.trim() : `+977${phone.trim()}`,
          address: address.trim(),
          countryId: selectedCountry,
          provinceId: selectedProvince,
          cityId: selectedCity,
          postalCode: postalCode.trim() || "",
          locationUrl: locationUrl.trim() || ""
        },
        items: cartItems.map(item => {
          // Extract the actual ID from the stringified ObjectId
          let productId = item.id;
          if (typeof item.id === 'string' && item.id.includes('ObjectId')) {
            const match = item.id.match(/'([^']+)'/);
            if (match) {
              productId = match[1];
            }
          }

          // Calculate total price including size and design
          let itemPrice = Number(item.price);
          let sizePrice = 0;
          let designPrice = 0;

          if (item.size) {
            sizePrice = Number(item.size.price);
            itemPrice += sizePrice;
          }

          if (item.design) {
            designPrice = Number(item.design.price);
            itemPrice += designPrice;
          }

          // Create a properly formatted item object
          const processedItem = {
            productId: productId.toString(),
            name: item.name,
            price: itemPrice,
            quantity: Number(item.quantity),
            image: item.image || "",
            size: item.size ? {
              size: item.size.size || "",
              price: sizePrice,
              sizeId: item.size.sizeId || null
            } : null,
            design: item.design ? {
              title: item.design.title || "",
              price: designPrice,
              image: item.design.image || ""
            } : null
          };

          console.log('Processed item:', processedItem);
          return processedItem;
        }),
        subtotal: Number(totalPrice),
        shipping: Number(shippingCost),
        totalAmount: Number(totalPrice) + Number(shippingCost),
        itemsCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        paymentMethod: selectedPaymentType,
        paymentStatus: "unpaid"
      };

      // Log final order data
      console.log('Order Data:', JSON.stringify(orderData, null, 2));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout Error Response:', JSON.stringify(errorData, null, 2));
        if (errorData.details) {
          throw new Error(`Validation failed: ${errorData.details}`);
        }
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();
      console.log('Checkout Success Response:', JSON.stringify(data, null, 2));
      clearCart();
      router.push(`/order-confirmation?orderId=${data.data?._id || data.data?.checkout?._id}&status=success`);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <section className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] py-12">
        <div className="container mx-auto px-4 mt-12">
          {/* Progress Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-brassGold rounded-full flex items-center justify-center text-ivoryWhite font-bold">
                  1
                </div>
                <span className="mt-2 text-sm text-ivoryWhite font-medium">Cart</span>
              </div>
              <div className="flex-1 h-1 bg-brassGold mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-brassGold rounded-full flex items-center justify-center text-ivoryWhite font-bold">
                  2
                </div>
                <span className="mt-2 text-sm text-ivoryWhite font-medium">Checkout</span>
              </div>
              <div className="flex-1 h-1 bg-brassGold mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-brassGold rounded-full flex items-center justify-center text-ivoryWhite font-bold">
                  3
                </div>
                <span className="mt-2 text-sm text-ivoryWhite font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-ivoryWhite">
              Complete Your Purchase
            </h1>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Side - Cart Summary */}
              <div className="lg:col-span-1">
                <Card
                  className="bg-deepGraphite shadow-xl rounded-2xl overflow-hidden border p-0 border-[#B87333]/30 hover:border-[#B87333]">
                  <CardHeader className="bg-[#D4AF37]/90 text-ivoryWhite p-6">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <ShoppingBag className="h-6 w-6" /> Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {cartItems.length === 0 ? (
                        <p className="text-center text-ivoryWhite py-4">
                          Your cart is empty.
                        </p>
                      ) : (
                        <>
                          <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                            {cartItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-ivoryWhite truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-sm text-ivoryWhite">
                                    Qty: {item.quantity}
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
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-ivoryWhite">
                                    {formatCurrency(
                                      (item.price + (item.size?.price || 0) + (item.design?.price || 0)) * item.quantity
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex justify-between text-ivoryWhite">
                              <span>
                                Subtotal ({cartItems.length}{" "}
                                {cartItems.length === 1 ? "item" : "items"})
                              </span>
                              <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-ivoryWhite">
                              <span>Shipping</span>
                              <span>
                                {shippingCost === 0
                                  ? "Select a city"
                                  : formatCurrency(shippingCost)}
                              </span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span className="text-ivoryWhite">Total</span>
                            <span className="text-ivoryWhite">{formatCurrency(total)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-6 bg-deepGraphite border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-400">
                      Secure Checkout
                    </h4>
                    <p className="text-sm text-green-400">
                      Your payment information is secure. We do not store credit
                      card details directly on our servers for online payments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle - Shipping Details */}
              <div className="lg:col-span-1">
                <Card className="bg-deepGraphite shadow-xl rounded-2xl overflow-hidden border h-full p-0 border-[#B87333]/30 hover:border-[#B87333]">
                  <CardHeader className="bg-[#B87333] text-ivoryWhite p-6">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Home className="h-6 w-6" /> Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-ivoryWhite" />
                          </div>
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10 w-full p-3 bg-[#2A2A2A] text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                            placeholder="Your Name"
                            required
                          />
                          {formErrors.fullName && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-ivoryWhite" />
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                            placeholder="Your Email"
                            required
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-ivoryWhite" />
                          </div>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10 w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                            placeholder="+977"
                            required
                          />
                          {formErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                          rows={3}
                          placeholder="Enter your full address"
                          required
                        />
                        {formErrors.address && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.address}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Country <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          required
                        >
                          <SelectTrigger className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl">
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent className="bg-deepGraphite text-ivoryWhite">
                            {Array.isArray(countries) && countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.country && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.country}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="province"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Province <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedProvince}
                          onValueChange={setSelectedProvince}
                          disabled={!selectedCountry || isFetchingProvinces}
                          required
                        >
                          <SelectTrigger className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl">
                            <SelectValue
                              placeholder={
                                isFetchingProvinces
                                  ? "Loading provinces..."
                                  : "Select a province"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-deepGraphite text-ivoryWhite">
                            {isFetchingProvinces ? (
                              <SelectItem value="loading" disabled className="text-ivoryWhite">
                                Loading provinces...
                              </SelectItem>
                            ) : Array.isArray(provinces) && provinces.length > 0 ? (
                              provinces.map((province) => (
                                <SelectItem key={province.id} value={province.id}>
                                  {province.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled className="text-ivoryWhite">
                                No provinces available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.province && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.province}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          City <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedCity}
                          onValueChange={setSelectedCity}
                          disabled={!selectedProvince || isFetchingCities}
                          required
                        >
                          <SelectTrigger className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl">
                            <SelectValue className="text-ivoryWhite"
                              placeholder={
                                isFetchingCities
                                  ? "Loading cities..."
                                  : "Select a city"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-deepGraphite text-ivoryWhite">
                            {isFetchingCities ? (
                              <SelectItem value="loading" disabled className="text-ivoryWhite">
                                Loading cities...
                              </SelectItem>
                            ) : Array.isArray(cities) && cities.length > 0 ? (
                              cities.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                No cities available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.city && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.city}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="postalCode"
                          className="block text-sm font-medium text-ivoryWhite"
                        >
                          Postal Code
                        </label>
                        <input
                          id="postalCode"
                          name="postalCode"
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                          placeholder="Postal Code (Optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="locationUrl"
                          className="text-sm font-medium text-ivoryWhite flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" /> PinPoint Location
                          (Optional)
                        </label>
                        <textarea
                          id="locationUrl"
                          name="locationUrl"
                          className="w-full p-3 bg-deepGraphite text-ivoryWhite border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all"
                          rows={2}
                          placeholder="Paste the URL of your exact location (e.g., Google Maps)"
                          value={locationUrl}
                          onChange={handleLocationUrlChange}
                        />
                        {coordinates && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="h-4 w-4" /> Location detected
                            successfully
                          </p>
                        )}
                        {locationError && (
                          <p className="text-sm text-red-600">
                            {locationError}
                          </p>
                        )}
                        {(locationUrl || coordinates) && (
                          <Button
                            type="button"
                            onClick={handleViewLocation}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 px-4 rounded-lg flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4" /> View Location
                          </Button>
                        )}
                        {formErrors.locationUrl && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.locationUrl}
                          </p>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Payment Options */}
              <div className="lg:col-span-1">
                <Card className="bg-deepGraphite shadow-xl rounded-2xl overflow-hidden border h-full p-0 border-[#B87333]/30 hover:border-[#B87333]">
                  <CardHeader className="bg-[#DE21AC] text-ivoryWhite p-6">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <CreditCard className="h-6 w-6" /> Payment Method{" "}
                      <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div
                        onClick={() => {
                          setSelectedPaymentType("cod");
                          setSelectedGateway(null);
                        }}
                        className={`group p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${selectedPaymentType === "cod"
                          ? "border-green-500 bg-deepGraphite"
                          : "border-gray-200 hover:border-green-300"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${selectedPaymentType === "cod"
                              ? "bg-green-900/90"
                              : "bg-green-600/20"
                              } group-hover:bg-green-600/40 transition-colors`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-ivoryWhite">
                              Cash on Delivery
                            </h3>
                            <p className="text-sm text-ivoryWhite">
                              Pay when you receive the item
                            </p>
                          </div>
                          {selectedPaymentType === "cod" && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        onClick={() => setSelectedPaymentType("online")}
                        className={`group p-5 border-2 rounded-xl bg-deepGraphite cursor-pointer transition-all duration-300 ${selectedPaymentType === "online"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${selectedPaymentType === "online"
                              ? "bg-purple-100"
                              : "bg-gray-300/90"
                              } group-hover:bg-purple-100 transition-colors`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-purple-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-ivoryWhite">
                              Online Payment
                            </h3>
                            <p className="text-sm text-ivoryWhite">
                              Secure instant payment
                            </p>
                          </div>
                          {selectedPaymentType === "online" && (
                            <div className="space-y-3 mt-5 ml-12">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGateway("esewa");
                                }}
                                className={`p-3 border-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${selectedGateway === "esewa"
                                  ? "border-green-500 bg-deepGraphite"
                                  : "border-gray-200 hover:border-green-400"
                                  }`}
                              >
                                <Image
                                  src="/images/esewa.png"
                                  alt="Esewa"
                                  width={32}
                                  height={32}
                                  className="rounded-lg"
                                />
                                <span className="font-medium text-ivoryWhite">
                                  Esewa
                                </span>
                                {selectedGateway === "esewa" && (
                                  <div className="ml-auto w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGateway("khalti");
                                }}
                                className={`p-3 border-2 rounded-xl bg-deepGraphite flex items-center gap-3 cursor-pointer transition-all ${selectedGateway === "khalti"
                                  ? "border-purple-500 bg-deepGraphite"
                                  : "border-gray-200 hover:border-purple-500"
                                  }`}
                              >
                                <Image
                                  src="/images/khalti.png"
                                  alt="Khalti"
                                  width={40}
                                  height={32}
                                  className="rounded-lg"
                                />
                                <span className="font-medium text-ivoryWhite">
                                  Khalti
                                </span>
                                {selectedGateway === "khalti" && (
                                  <div className="ml-auto w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGateway("himalaya");
                                }}
                                className={`p-3 border-2 rounded-xl bg-deepGraphite flex items-center gap-3 cursor-pointer transition-all ${selectedGateway === "himalaya"
                                  ? "border-blue-500 bg-deepGraphite"
                                  : "border-gray-200 hover:border-blue-400"
                                  }`}
                              >
                                <Image
                                  src="/images/Himlayanicon.png"
                                  alt="Himalaya Bank"
                                  width={32}
                                  height={32}
                                  className="rounded-lg"
                                />
                                <span className="font-medium text-ivoryWhite">
                                  Himalaya Bank
                                </span>
                                {selectedGateway === "himalaya" && (
                                  <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 bg-deepGraphite">
                    <Button
                      type="submit"
                      disabled={isLoading || cartItems.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] text-ivoryWhite text-md rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Complete Order"
                      )}
                      {!isLoading && <ChevronRight className="h-5 w-5" />}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
