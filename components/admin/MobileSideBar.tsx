"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import {
  CreditCard,
  Home,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  User,
  MessageSquareText,
  TableOfContents,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SiteSettingsDropdown from "./SiteDropdown";
import ProductDropdown from "./ProductDropdown";
import BlogDropdown from "./BlogDropdown";
import CountryDropDown from "./CountryDropDown";
import BundleDropdown from "./BundleInfo";
import { useAuth } from "@/app/admin/providers/AuthProviders";

interface MobileSideBarProps {
  navigateToOrders?: () => void;
}

const MobileSideBar = ({ navigateToOrders }: MobileSideBarProps = {}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isLoading, logout } = useAuth();

  const [displayImage, setDisplayImage] = useState(
    admin?.image || "/images/default-profile.png"
  );
  const [displayEmail, setDisplayEmail] = useState(
    admin?.email || "admin@gmail.com"
  );

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayEmail(admin.email);
      const imageUrl =
        admin.image && admin.image !== ""
          ? admin.image.replace(/^\/public\//, "/")
          : "/images/default-profile.png";
      setDisplayImage(imageUrl);
    } else if (!isLoading && !admin) {
      setDisplayImage("/images/default-profile.png");
      setDisplayEmail("admin@gmail.com");
    }
  }, [admin, isLoading]);

  const handleImageError = () => {
    setDisplayImage("/images/default-profile.png");
    toast.error("Failed to load profile image");
  };

  const handleOrdersClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigateToOrders) {
      navigateToOrders();
    } else {
      router.push("/admin/dashboard/orders");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const handleSetting = () => {
    router.push("/admin/dashboard/setting");
  };

  const displayRole =
    admin?.role && admin.role.length > 0
      ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1)
      : "Guest";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40 text-white hover:bg-white/10 hover:text-white/80"
          aria-label="Open mobile menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white p-0 w-64"
      >
        <SheetHeader>
          <div className="flex h-16 items-center px-6 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
              <span className="font-bold text-lg">Rudraksha Store</span>
            </Link>
          </div>
        </SheetHeader>
        <SheetTitle />
        <SheetDescription />

        <nav className="grid gap-1 p-4 -mt-16">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard" ? "border border-purple-500" : ""
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/dashboard/orders"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/orders" ? "border border-purple-500" : ""
            }`}
            onClick={handleOrdersClick}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Orders</span>
          </Link>

          <ProductDropdown />

          <Link
            href="/admin/dashboard/customers"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/customers" ? "border border-purple-500" : ""
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>

          <Link
            href="/admin/dashboard/payments"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/payments" ? "border border-purple-500" : ""
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Payments</span>
          </Link>

          <Link
            href="/admin/dashboard/shipping"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/shipping" ? "border border-purple-500" : ""
            }`}
          >
            <Truck className="h-5 w-5" />
            <span>Shipping</span>
          </Link>

          <BlogDropdown />

          <BundleDropdown />

          <Link
            href="/admin/dashboard/faq"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/faq" ? "border border-purple-500" : ""
            }`}
          >
            <TableOfContents className="h-5 w-5" />
            <span>FAQ</span>
          </Link>

          <Link
            href="/admin/dashboard/testimonial"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/testimonial" ? "border border-purple-500" : ""
            }`}
          >
            <MessageSquareText className="h-5 w-5" />
            <span>Testimonial</span>
          </Link>

          <Link
            href="/admin/dashboard/benefit"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/benefit" ? "border border-purple-500" : ""
            }`}
          >
            <Gift className="h-5 w-5" />
            <span>Benefit</span>
          </Link>

          {admin?.role === "admin" && (
            <>
              <Link
                href="/admin/dashboard/user"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
                  pathname === "/admin/dashboard/user" ? "border border-purple-500" : ""
                }`}
              >
                <User className="h-5 w-5" />
                <span>Users</span>
              </Link>
              <SiteSettingsDropdown />
            </>
          )}

          <CountryDropDown />
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={displayImage}
                alt={admin?.email || "Profile"}
                onError={handleImageError}
              />
              <AvatarFallback className="bg-purple-600">
                {isLoading ? "..." : admin?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {isLoading ? "Loading..." : displayEmail}
              </p>
              <p className="text-xs text-white/70">{displayRole}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-900 border border-white/10 text-white"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  onClick={handleSetting}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="text-white/70">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="text-white/70">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSideBar;