"use client";
import {
  Check,
  Globe,
  Menu,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useRef, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";
import { LanguageKey, useLanguage } from "@/context/language-context";
import Image from "next/image";
import {
  headerEnglishTexts,
  headerChineseTexts,
  headerHindiTexts,
  headerNepaliTexts,
} from "@/language";
import { toast, Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const messages = [
  "Welcome to Rudraksha – Embrace Spiritual Elegance",
  "Free Shipping on Orders Over $100 • Authentic Certification",
  "Ancient Wisdom, Modern Elegance • Discover the Power of Rudraksha",
];

export default function Header() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [showRibbon, setShowRibbon] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const navRef = useRef<HTMLElement>(null);


  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const miniCartRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(0);

  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useCart();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';

      // Smooth transition for scroll states
      if (direction === 'down') {
        setIsScrolled(currentScrollY > 20);
        setShowRibbon(currentScrollY <= 20);
      } else {
        setIsScrolled(currentScrollY > 20);
        setShowRibbon(currentScrollY <= 20);
      }

      setLastScrollY(currentScrollY);
    };

    // Use requestAnimationFrame for smoother scroll handling
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener, { passive: true });
    return () => window.removeEventListener("scroll", scrollListener);
  }, [lastScrollY]);

  useEffect(() => {
    setMounted(true);
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const authToken = localStorage.getItem("authToken");

    if (authToken && !token) {
      localStorage.setItem("token", authToken);
    } else if (token && !authToken) {
      localStorage.setItem("authToken", token);
    }

    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setUserRole(storedRole);


    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/sitesetting/setting/logo", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch settings: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        const logo = data?.data?.logo?.url ?? null;
        setLogoUrl(logo);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setLogoUrl(null);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        miniCartRef.current &&
        !miniCartRef.current.contains(event.target as Node)
      ) {
        setMiniCartOpen(false);
      }
    };

    if (isDropdownOpen || userDropdownOpen || miniCartOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, userDropdownOpen, miniCartOpen]);

  const languageMap = {
    english: headerEnglishTexts,
    chinese: headerChineseTexts,
    hindi: headerHindiTexts,
    nepali: headerNepaliTexts,
  };

  const texts = mounted ? languageMap[selectedLanguage] : headerEnglishTexts;

  const navLinks = [
    { id: 1, name: texts.home, href: "/" },
    { id: 2, name: texts.shop, href: "/shop" },
    { id: 3, name: texts.about, href: "/about" },
    { id: 4, name: texts.blog, href: "/blog" },
    { id: 5, name: texts.contact, href: "/contact" },
  ];


  const totalItemsInCart = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    if (totalItemsInCart > prevCartCount.current) {
      const cartIcon = document.querySelector(".cart-icon");
      if (cartIcon) {
        cartIcon.classList.add("animate-bounce");
        setTimeout(() => cartIcon.classList.remove("animate-bounce"), 500);
      }
    }
    prevCartCount.current = totalItemsInCart;
  }, [totalItemsInCart]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("accountType");
      setUsername("");
      setUserRole(null);
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language as LanguageKey);
    setIsDropdownOpen(false);
  };

  const navigateToAdminDashboard = () => {
    setUserDropdownOpen(false);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user");

    if (token && (role === "admin" || role === "editor" || role === "user") && user) {
      // Ensure admin data is properly set
      const adminData = JSON.parse(user);
      if (adminData.token === token) {
        // Store admin token and data before redirecting
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(adminData));
        window.location.replace("/admin/dashboard");
      } else {
        toast.error("Authentication error. Please login again.");
        router.push("/auth/login");
      }
    } else {
      toast.error("Please login as admin first");
      router.push("/auth/login");
    }
  };

  const handleNavigation = (href: string) => {
    startTransition(() => router.push(href));
  };

  const isAdminUser =
    userRole && ["admin", "editor", "user"].includes(userRole);
  // const isCustomer = userRole === "customer";


  return (
    <>
      <header
        ref={navRef}
        className={`fixed w-full z-40 transition-all duration-300 ease-in-out ${isScrolled ? "bg-[#2A2A2A]/70 backdrop-blur-lg shadow-md" : "bg-transparent"
          }`}
      >
        <AnimatePresence mode="wait">
          {showRibbon && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "2.5rem" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative bg-brassGold text-white shadow-md"

            >
              <div className="relative h-6 overflow-hidden">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className="absolute md:w-[90%] w-full flex justify-center items-center h-full font-semibold text-sm text-charcoalBlack whitespace-nowrap mt-1"
                    initial={{ y: index === 0 ? 0 : 30 }}
                    animate={{
                      y: index === currentMessageIndex ? 0 : index === (currentMessageIndex - 1 + messages.length) % messages.length ? -30 : 30,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {message}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative flex items-center transition-transform group-hover:scale-105">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="logo"
                    width={40}
                    height={20}
                    onError={() => setLogoUrl(null)}
                  />
                ) : (
                  <span className="text-xl font-bold text-white"></span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch={true}
                  onClick={() => handleNavigation(link.href)}
                  className={`relative text-lg font-medium font-poppins  text-gray-200 transition-colors hover:text-white ${pathname === link.href ? "text-amber-600" : ""
                    } after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-600 after:scale-x-0 after:transition-transform after:origin-left hover:after:scale-x-100 ${pathname === link.href ? "after:scale-x-100" : ""
                    }`}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* User Dropdown (Desktop Only) */}
              {username ? (
                <div className="hidden md:block relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 text-lg font-medium font-poppins text-gray-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1"
                    aria-label="User menu"
                    aria-expanded={userDropdownOpen}
                  >
                    <User className="h-5 w-5 stroke-2 text-gray-200 hover:text-white" />
                    <span>{username}</span>
                    <svg
                      className="w-4 h-4 fill-current text-gray-200 group-hover:fill-white"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] border border-[#D4AF37] rounded-lg z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right overflow-hidden"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="p-4 bg-[#2A2A2A]/40 border-b border-[#D4AF37] text-ivoryWhite">
                        Account Options
                      </div>
                      <div className="flex flex-col divide-y divide-[#D4AF37]">

                        <Link
                          href="/dashboard"
                          onClick={() => {
                            handleNavigation("/dashboard");
                            setUserDropdownOpen(false);
                          }}
                          className="text-base p-4 font-medium text-ivoryWhite hover:text-ivoryWhite transition-colors text-left cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        >
                          Account Details
                        </Link>


                        {isAdminUser && (
                          <button
                            onClick={navigateToAdminDashboard}
                            className="flex items-center gap-3 p-4 text-left hover:bg-[#B87333]/30 motion-safe:transition-colors text-base text-ivoryWhite font-medium focus-visible:outline-none focus-visible:bg-indigo-800/40 focus-visible:text-amber-300 w-full"
                          >
                            <LayoutDashboard className="h-5 w-5 stroke-2 text-brassGold" />
                            Admin Dashboard
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="flex items-center gap-3 p-4 text-left hover:bg-[#8B1A1A]/20 motion-safe:transition-colors text-base text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:bg-red-900/30 focus-visible:text-red-300 w-full"
                        >
                          {isLoggingOut ? (
                            <svg
                              className="motion-safe:animate-spin h-5 w-5 text-ivoryWhite"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                              />
                            </svg>
                          ) : (
                            <LogOut className="h-5 w-5 stroke-2 text-red-300" />
                          )}
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-base lg:text-lg font-medium font-poppins text-gray-200 hover:text-white motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md px-3 py-2 min-h-[48px] flex items-center"
                  >
                    {texts.signin}
                  </Link>
                </div>
              )}

              {/* Cart Icon */}
              <div className="relative" ref={miniCartRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMiniCartOpen(!miniCartOpen)}
                  aria-label={`Cart with ${totalItemsInCart} items`}
                  aria-expanded={miniCartOpen}
                  aria-haspopup="true"
                  className="relative rounded-xl text-white hover:bg-gray-600/30 hover:text-white cart-icon"
                >
                  <ShoppingCart className="size-5 md:size-6 stroke-2" />
                  {totalItemsInCart > 0 && (
                    <span className="absolute top-[-2px] right-[-6px] bg-red-400 text-white text-xs font-bold rounded-full min-w-[18px] h-5 flex items-center justify-center px-1 motion-safe:animate-pulse motion-reduce:animate-none">
                      {totalItemsInCart}
                    </span>
                  )}
                </Button>
                {miniCartOpen && (
                  <div
                    className="fixed md:absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-[320px] lg:w-[400px] bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] border border-[#D4AF37] rounded-lg shadow-xl z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right"
                    aria-modal="true"
                    aria-label="Mini Cart Preview"
                  >
                    <div className="p-3 sm:p-4 text-base sm:text-lg font-semibold text-ivoryWhite border-b border-gray-600 flex justify-between items-center">
                      <span>Your Cart</span>
                      <button
                        onClick={() => setMiniCartOpen(false)}
                        className="p-1 rounded-full hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label="Close mini cart"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-ivoryWhite"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="p-3 sm:p-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                      {cartItems.length > 0 ? (
                        <ul className="space-y-2">
                          {cartItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between items-center text-xs sm:text-sm text-ivoryWhite motion-safe:transition-opacity"
                            >
                              <span className="truncate max-w-[65%] sm:max-w-[70%] pr-2">
                                {item.name}
                              </span>
                              <span className="font-medium">
                                x{item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm sm:text-base text-ivoryWhite text-center py-3 sm:py-4">
                          Your cart is empty
                        </p>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 border-t border-gray-600">
                      <Link
                        href="/cart"
                        onClick={() => setMiniCartOpen(false)}
                        className="block text-center w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] text-white rounded-lg motion-safe:transition-all duration-200 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      >
                        View Cart
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-[#2A2A2A]/30 p-3 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Change language"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <Globe className="size-5 md:size-6 text-gray-200 group-hover:text-white stroke-2" />
                </Button>
                {isDropdownOpen && (
                  <div
                    className="fixed md:absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-56 bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] border border-[#D4AF37] rounded-lg shadow-xl z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right overflow-hidden"
                    aria-orientation="vertical"
                    aria-label="Language Menu"
                  >
                    <div className="p-4 text-lg font-semibold text-ivoryWhite border-b border-gray-600">
                      Change Language
                    </div>
                    <div className="flex flex-col p-1 gap-1">
                      {[
                        {
                          lang: "english",
                          flag: "/images/usa.png",
                          label: "English",
                        },
                        {
                          lang: "chinese",
                          flag: "/images/china.png",
                          label: "Chinese",
                        },
                        {
                          lang: "hindi",
                          flag: "/images/india.png",
                          label: "Hindi",
                        },
                        {
                          lang: "nepali",
                          flag: "/images/nepal.png",
                          label: "Nepali",
                        },
                      ].map(({ lang, flag, label }) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`flex items-center justify-between gap-3 p-3 w-full text-left hover:bg-gray-700/80 hover:text-white rounded-md text-base text-ivoryWhite motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:bg-gray-700/90 ${selectedLanguage === lang
                            ? "bg-gray-700/50 font-semibold"
                            : ""
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={flag}
                              alt={label}
                              width={24}
                              height={16}
                              className="w-6 h-4 object-cover rounded-sm"
                            />
                            {label}
                          </div>
                          {selectedLanguage === lang && (
                            <Check
                              className="h-4 w-4 text-brassGold stroke-2"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Trigger (Visible on Mobile) */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full hover:bg-gray-700 p-4 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    aria-label="Open mobile menu"
                  >
                    <Menu className="h-9 w-9 text-gray-200 stroke-2" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[320px] sm:w-[380px] p-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black border-l border-amber-500/30 backdrop-blur-lg"
                >
                  <SheetTitle className="sr-only">
                    Mobile Navigation Menu
                  </SheetTitle>
                  <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-600/10 to-amber-800/10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white">Menu</h2>
                      <div className="w-8 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
                    </div>
                  </div>
                  <nav className="px-4 py-6">
                    <div className="space-y-2">
                      {navLinks.map((link, index) => (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                          <Link
                            key={link.id}
                            href={link.href}
                            prefetch={true}
                            onClick={() => handleNavigation(link.href)}
                            className={`group flex items-center justify-between w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-amber-600/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${pathname === link.href
                              ? "bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-amber-400 border border-amber-500/30"
                              : "text-gray-300 hover:text-white"
                              }`}
                            aria-current={pathname === link.href ? "page" : undefined}
                          >
                            <span className="font-poppins tracking-wide">{link.name}</span>
                            <svg
                              className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${pathname === link.href ? "text-amber-400" : "text-gray-500 group-hover:text-amber-400"
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </nav>
                  <div className="px-4 pb-6">

                    {username ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Signed in as</p>
                              <p className="text-white font-semibold truncate max-w-[200px]">{username}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: "Dashboard", href: "/dashboard", icon: "📊" },
                            { label: "Order History", href: "/dashboard/order-history", icon: "📦" },
                            { label: "Wishlist", href: "/dashboard/wishlist", icon: "❤️" },
                            { label: "My Profile", href: "/dashboard/profile", icon: "👤" },
                            { label: "Change Password", href: "/dashboard/password", icon: "🔐" }
                          ].map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => {
                                handleNavigation(item.href);
                                setUserDropdownOpen(false);
                              }}
                              className="group flex items-center space-x-3 w-full p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-[1.01]"
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span className="font-medium">{item.label}</span>
                              <svg className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1 text-gray-500 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                          {isAdminUser && (
                            <button
                              onClick={navigateToAdminDashboard}
                              className="group flex items-center space-x-3 w-full p-3 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-all duration-200 hover:scale-[1.01]"
                            >
                              <LayoutDashboard className="w-5 h-5" />
                              <span className="font-medium">Admin Dashboard</span>
                              <svg className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="group flex items-center space-x-3 w-full p-3 rounded-lg bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 text-red-400 hover:text-red-300 hover:from-red-800/40 hover:to-red-700/30 transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                            {isLoggingOut ? (
                              <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                                </svg>
                                <span className="font-medium">Logging out...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                                <svg className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>

                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 text-center">
                          <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm mb-4">Sign in to access your account</p>
                          <Link
                            href="/auth/login"
                            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20"
                          >
                            <span>{texts.signin}</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>

                </SheetContent>
              </Sheet>
            </div>
          </div>
        </motion.div>
      </header>
      <Toaster position="bottom-right" />
    </>
  );
}
