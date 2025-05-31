"use client";
import {
  Check,
  Globe,
  Menu,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Home,
  Store,
  Info,
  BookText,
  Phone,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import Image from "next/image";
import {
  headerEnglishTexts,
  headerChineseTexts,
  headerHindiTexts,
  headerNepaliTexts,
} from "@/language";
import { LanguageKey } from "@/context/language-context";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  logoUrl: string | null;
  username: string;
  userRole: string | null;
  selectedLanguage: LanguageKey;
  setSelectedLanguage: (language: LanguageKey) => void;
  cartItems: { id: string; name: string; quantity: number }[];
  isLoggingOut: boolean;
  handleLogout: () => Promise<void>;
  handleLanguageChange: (language: string) => void;
  navigateToAdminDashboard: () => void;
  handleNavigation: (href: string) => void;
}

const navIcons = {
  home: <Home className="h-5 w-5" />,
  shop: <Store className="h-5 w-5" />,
  about: <Info className="h-5 w-5" />,
  blog: <BookText className="h-5 w-5" />,
  contact: <Phone className="h-5 w-5" />,
};

export default function MobileHeader({
  logoUrl,
  username,
  userRole,
  selectedLanguage,
  cartItems,
  isLoggingOut,
  handleLogout,
  handleLanguageChange,
  navigateToAdminDashboard,
  handleNavigation,
}: MobileHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(0);

  const pathname = usePathname();
  const router = useRouter();

  const languageMap = {
    english: headerEnglishTexts,
    chinese: headerChineseTexts,
    hindi: headerHindiTexts,
    nepali: headerNepaliTexts,
  };

  const texts = languageMap[selectedLanguage];

  const navLinks = [
    { id: 1, name: texts.home, href: "/", icon: "home" },
    { id: 2, name: texts.shop, href: "/shop", icon: "shop" },
    { id: 3, name: texts.about, href: "/about", icon: "about" },
    { id: 4, name: texts.blog, href: "/blog", icon: "blog" },
    { id: 5, name: texts.contact, href: "/contact", icon: "contact" },
  ];

  const totalItemsInCart = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const isAdminUser = userRole && ["admin", "editor", "user"].includes(userRole);

  const handleCartClick = () => {
    if (totalItemsInCart > 0) {
      setIsCartOpen(!isCartOpen);
    } else {
      router.push("/cart");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full bg-gradient-to-r from-gray-900 to-indigo-900 text-white transition-all duration-300",
        isScrolled ? "shadow-lg py-2" : "shadow-md py-3"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative flex items-center transition-transform group-hover:scale-105">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="logo"
                  width={60}
                  height={60}
                  className="object-contain rounded-md"
                  priority
                />
              ) : (
                <span className="text-xl font-bold text-white">Logo</span>
              )}
            </div>
          </Link>

          {/* Right side icons */}
          <div className="flex items-center space-x-3">
            {/* Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-700/50 p-2 h-10 w-10"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Change language"
              >
                <Globe className="h-5 w-5 text-gray-200" />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 animate-fadeIn">
                  <div className="p-3 text-sm font-semibold border-b border-gray-700">
                    Select Language
                  </div>
                  <div className="p-2 space-y-1">
                    {[
                      { lang: "english", flag: "/images/usa.png", label: "English" },
                      { lang: "chinese", flag: "/images/china.png", label: "Chinese" },
                      { lang: "hindi", flag: "/images/india.png", label: "Hindi" },
                      { lang: "nepali", flag: "/images/nepal.png", label: "Nepali" },
                    ].map(({ lang, flag, label }) => (
                      <button
                        key={lang}
                        onClick={() => {
                          handleLanguageChange(lang);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center w-full p-2 rounded-md text-sm",
                          selectedLanguage === lang
                            ? "bg-indigo-800/50 text-white"
                            : "text-gray-300 hover:bg-gray-700/50"
                        )}
                      >
                        <Image
                          src={flag}
                          alt={label}
                          width={20}
                          height={15}
                          className="w-5 h-4 mr-2 object-cover rounded-sm"
                        />
                        {label}
                        {selectedLanguage === lang && (
                          <Check className="h-4 w-4 ml-auto text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart with dropdown */}
            <div className="relative" ref={cartRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full hover:bg-gray-700/50 p-2 h-10 w-10 cart-icon relative",
                  isCartOpen && "bg-gray-700/50"
                )}
                onClick={handleCartClick}
                aria-label={`Cart with ${totalItemsInCart} items`}
              >
                <ShoppingCart className="h-5 w-5 text-gray-200" />
                {totalItemsInCart > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {totalItemsInCart}
                  </span>
                )}
              </Button>

              {isCartOpen && totalItemsInCart > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 animate-fadeIn">
                  <div className="p-3 text-sm font-semibold border-b border-gray-700 flex justify-between items-center">
                    <span>Your Cart ({totalItemsInCart})</span>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-700"
                      aria-label="Close cart"
                    >
                      <svg
                        className="w-4 h-4 text-gray-300"
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
                  <div className="max-h-60 overflow-y-auto p-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
                      >
                        <span className="text-sm font-medium truncate max-w-[70%]">
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-300">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-700">
                    <SheetClose asChild>
                      <Link
                        href="/cart"
                        className="block w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                        onClick={() => setIsCartOpen(false)}
                      >
                        View Cart & Checkout
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            {username ? (
              <div className="relative" ref={userDropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full hover:bg-gray-700/50 p-2 h-10 w-10",
                    userDropdownOpen && "bg-gray-700/50"
                  )}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User menu"
                >
                  <User className="h-5 w-5 text-gray-200" />
                </Button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 animate-fadeIn">
                    <div className="p-3 text-sm font-semibold border-b border-gray-700">
                      Hello, {username}
                    </div>
                    <div className="p-1">
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center w-full p-2 rounded-md text-sm hover:bg-gray-700/50"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Link>
                      </SheetClose>
                      {isAdminUser && (
                        <button
                          onClick={() => {
                            navigateToAdminDashboard();
                            setUserDropdownOpen(false);
                          }}
                          className="flex items-center w-full p-2 rounded-md text-sm hover:bg-gray-700/50 text-amber-400"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserDropdownOpen(false);
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center w-full p-2 rounded-md text-sm hover:bg-gray-700/50 text-red-400 disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <SheetClose asChild>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium px-3 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition-colors"
                  onClick={() => setIsSheetOpen(false)}
                >
                  {texts.signin}
                </Link>
              </SheetClose>
            )}

            {/* Mobile menu button */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-700/50 p-2 h-10 w-10"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 text-gray-200" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-96 bg-gradient-to-b from-gray-800 to-indigo-950 border-l border-indigo-700 overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-white">
                    Menu
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-1">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.id}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors",
                          pathname === link.href
                            ? "bg-indigo-800/50 text-white"
                            : "text-gray-300 hover:bg-gray-700/50"
                        )}
                        onClick={() => handleNavigation(link.href)}
                      >
                        {navIcons[link.icon as keyof typeof navIcons]}
                        <span className="ml-3">{link.name}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                    Account
                  </h3>
                  {username ? (
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-sm text-gray-300">
                        Signed in as{" "}
                        <span className="font-medium text-white">{username}</span>
                      </div>
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center w-full p-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </SheetClose>
                      {isAdminUser && (
                        <button
                          onClick={() => {
                            navigateToAdminDashboard();
                            setIsSheetOpen(false);
                          }}
                          className="flex items-center w-full p-3 rounded-lg text-sm font-medium text-amber-400 hover:bg-gray-700/50"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsSheetOpen(false);
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center w-full p-3 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-700/50 disabled:opacity-50"
                      >
                        {isLoggingOut ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 px-3">
                      <SheetClose asChild>
                        <Link
                          href="/auth/login"
                          className="block w-full text-center py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md transition-colors"
                        >
                          Sign In
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/auth/register"
                          className="block w-full text-center py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-md transition-colors"
                        >
                          Create Account
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}