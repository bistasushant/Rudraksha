"use client";

import { useState, useEffect, useRef } from "react";
import {
  Heart,
  History,
  Home,
  Lock,
  LogOut,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [username, setUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const prevCartCount = useRef(0);

  useEffect(() => {
    // Set active tab based on current pathname
    if (pathname === "/dashboard") {
      setActiveTab("dashboard");
    } else if (pathname === "/dashboard/order-history") {
      setActiveTab("orders");
    } else if (pathname === "/dashboard/wishlist") {
      setActiveTab("wishlist");
    } else if (pathname === "/dashboard/profile") {
      setActiveTab("profile");
    } else if (pathname === "/dashboard/password") {
      setActiveTab("password");
    }
  }, [pathname]);

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "dashboard":
        router.push("/dashboard");
        break;
      case "orders":
        router.push("/dashboard/order-history");
        break;
      case "wishlist":
        router.push("/dashboard/wishlist");
        break;
      case "profile":
        router.push("/dashboard/profile");
        break;
      case "password":
        router.push("/dashboard/password");
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("/api/cart", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cart items: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.message || "Failed to fetch cart items");
        }

        const totalItems = result.data.items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
        setCartItemCount(totalItems);
      } catch (err) {
        console.error("Error fetching cart items:", err);
        toast.error(err instanceof Error ? err.message : "Failed to fetch cart items");
        setCartItemCount(0);
      }
    };

    fetchCartItems();
  }, []);

  useEffect(() => {
    if (cartItemCount > prevCartCount.current) {
      const cartIcon = document.querySelector(".cart-icon");
      if (cartIcon) {
        cartIcon.classList.add("animate-bounce");
        setTimeout(() => cartIcon.classList.remove("animate-bounce"), 500);
      }
    }
    prevCartCount.current = cartItemCount;
  }, [cartItemCount]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        const storedRole = localStorage.getItem("role");

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Determine which endpoint to use based on role
        const endpoint = storedRole === "admin" ? "/api/admin/profile" : "/api/customer/profile";

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.message || "Failed to fetch user data");
        }

        const userData = result.data;

        setUsername(userData.name || "");
        setUserEmail(userData.email || "");
        setUserImage(userData.image || null);
        setUserRole(storedRole || userData.role || null);

        localStorage.setItem("username", userData.name || "");
        localStorage.setItem("email", userData.email || "");
        if (userData.image) {
          localStorage.setItem("userImage", userData.image);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch user data");

        const storedUsername = localStorage.getItem("username");
        const storedEmail = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");

        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setUserEmail(storedEmail);
        if (storedRole) setUserRole(storedRole);

        const storedImage = localStorage.getItem("userImage");
        if (storedImage) setUserImage(storedImage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const NavButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    color = "amber"
  }: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    color?: string;
  }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`group relative w-full justify-start px-4 py-3 h-auto rounded-xl transition-all duration-300 hover:scale-[1.02] ${isActive
        ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg shadow-${color}-500/30 hover:shadow-${color}-500/40`
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-800/60"
        }`}
    >
      {!isActive && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-${color}-500/10 to-${color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      )}

      <Icon className={`mr-3 h-5 w-5 transition-transform duration-300 text-ivoryWhite group-hover:scale-110 ${isActive ? 'text-ivoryWhite' : ''}`} />
      <span className="font-medium relative z-10 text-ivoryWhite">{label}</span>

      {isActive && (
        <div className="absolute right-3 w-2 h-2 bg-ivoryWhite rounded-full animate-pulse" />
      )}
    </Button>
  );

  return (
    <div className="hidden md:flex flex-col w-80 border-r border-gray-200/60 dark:border-gray-700/60 bg-charcoalBlack dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 mt-20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-3 border-[#B87333] shadow-lg">
              <AvatarImage
                src={userImage ? (userImage.startsWith('/public') ? userImage.substring(7) : userImage) : "/placeholder.svg"}
                alt={username || "User"}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-semibold">
                {isLoading ? "..." : username ? username.substring(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ivoryWhite dark:text-white truncate">
              {isLoading ? "Loading..." : error ? "Error loading data" : username || "Guest"}
            </p>
            <p className="text-xs text-ivoryWhite dark:text-gray-400 truncate">
              {isLoading ? "Loading..." : error ? "Please try again" : userEmail || "No email"}
            </p>
            {userRole && (
              <p className="text-xs text-[#D4AF37] font-medium mt-1">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-6">
        <div className="space-y-2 px-4">
          <NavButton icon={Home} label="Dashboard" isActive={activeTab === "dashboard"} onClick={() => handleNavigation("dashboard")} />
          <NavButton icon={History} label="Order History" isActive={activeTab === "orders"} onClick={() => handleNavigation("orders")} />
          <NavButton icon={Heart} label="Wishlist" isActive={activeTab === "wishlist"} onClick={() => handleNavigation("wishlist")} />
          {userRole === "customer" && (
            <>
              <NavButton icon={User} label="My Profile" isActive={activeTab === "profile"} onClick={() => handleNavigation("profile")} />
              <NavButton icon={Lock} label="Change Password" isActive={activeTab === "password"} onClick={() => handleNavigation("password")} />
            </>
          )}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 p-4">
        <Button
          variant="ghost"
          className="group relative w-4/5 bg-gradient-to-r from-red-400 via-red-700 to-red-800 text-ivoryWhite font-bold rounded-2xl border-2 border-[#D4AF37]/20 overflow-hidden transation-all duration-300 hover:scale-105 hover-shadow-xl hover:shadow-red-500/25  hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-[1.02]"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}