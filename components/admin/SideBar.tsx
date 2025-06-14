"use client";
import {
  CreditCard,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  User,
  FileText,
  MessageSquareText,
  TableOfContents,
  DiamondPercent,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import SiteSettingsDropdown from "./SiteDropdown";
import ProductDropdown from "./ProductDropdown";
import BlogDropdown from "./BlogDropdown";
import { toast } from "sonner";
import CountryDropDown from "./CountryDropDown";
import BundleDropdown from "./BundleInfo";

interface Admin {
  role?: string;
  email?: string;
  image?: string;
  token?: string;
}

interface SideBarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const NavLinks = ({
  isSidebarOpen,
  pathname,
  admin,
}: {
  isSidebarOpen: boolean;
  pathname: string;
  admin: Admin | null;
}) => {
  return (
    <nav className="grid gap-1 px-2">
      <Link
        href="/admin/dashboard"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:text-purple-400 ${
          pathname === "/admin/dashboard" ? "border border-purple-500" : ""
        }`}
      >
        <Home className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Dashboard
        </span>
      </Link>

      <Link
        href="/admin/dashboard/orders"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/orders"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <ShoppingCart className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Orders
        </span>
      </Link>

      {isSidebarOpen ? (
        <ProductDropdown />
      ) : (
        <Link
          href="/admin/dashboard/products"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
            pathname.startsWith("/admin/dashboard/category") ||
            pathname.startsWith("/admin/dashboard/subcategory") ||
            pathname.startsWith("/admin/dashboard/size") ||
            pathname.startsWith("/admin/dashboard/products") 
              ? "border border-purple-500"
              : ""
          }`}
        >
          <Package className="h-5 w-5" />
          <span
            className={`transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Products
          </span>
        </Link>
      )}

      <Link
        href="/admin/dashboard/customers"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/customers"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <Users className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Customers
        </span>
      </Link>

      <Link
        href="/admin/dashboard/payments"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/payments"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <CreditCard className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Payments
        </span>
      </Link>

      <Link
        href="/admin/dashboard/shipping"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/shipping"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <Truck className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Shipping
        </span>
      </Link>

      {isSidebarOpen ? (
        <BlogDropdown />
      ) : (
        <Link
          href="/admin/dashboard/blog"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
            pathname.startsWith("/admin/dashboard/blogcategory") ||
            pathname.startsWith("/admin/dashboard/blog")
              ? "border border-purple-500"
              : ""
          }`}
        >
          <FileText className="h-5 w-5" />
          <span
            className={`transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Blog
          </span>
        </Link>
      )}
      {isSidebarOpen ? (
        <BundleDropdown />
      ) : (
        <Link
          href="/admin/dashboard/banner"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${
            pathname.startsWith("/admin/dashboard/banner") ||
            pathname.startsWith("/admin/dashboard/package")
              ? "border border-purple-500"
              : ""
          }`}
        >
          <DiamondPercent className="h-5 w-5" />
          <span
            className={`transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Bundle Info
          </span>
        </Link>
      )}

      <Link
        href="/admin/dashboard/faq"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/faq" ? "border border-purple-500" : ""
        }`}
      >
        <TableOfContents className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          FAQ
        </span>
      </Link>

      <Link
        href="/admin/dashboard/testimonial"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/testimonial"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <MessageSquareText className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Testimonial
        </span>
      </Link>

      <Link
        href="/admin/dashboard/benefit"
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
          pathname === "/admin/dashboard/benefit"
            ? "border border-purple-500"
            : ""
        }`}
      >
        <Gift className="h-5 w-5" />
        <span
          className={`transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Benefit
        </span>
      </Link>

      {admin?.role === "admin" && (
        <>
          <Link
            href="/admin/dashboard/user"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/user"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <User className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Users
            </span>
          </Link>

          {isSidebarOpen && <SiteSettingsDropdown />}
        </>
      )}
      {isSidebarOpen && <CountryDropDown />}
    </nav>
  );
};

const SideBar = ({ isSidebarOpen, toggleSidebar }: SideBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, admin, isLoading } = useAuth();

  const [displayEmail, setDisplayEmail] = useState(
    admin?.email ?? "admin@gmail.com"
  );
  const [displayImage, setDisplayImage] = useState(
    admin?.image ?? "/images/default-profile.png"
  );

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayEmail(admin.email);
      const imageUrl =
        admin?.image && admin.image !== ""
          ? admin.image.replace(/^\/public\//, "/")
          : "/images/default-profile.png";
      setDisplayImage(imageUrl);
    } else if (!isLoading && !admin) {
      setDisplayEmail("admin@gmail.com");
      setDisplayImage("/images/default-profile.png");
    }
  }, [admin, isLoading]);

  const handleImageError = () => {
    setDisplayImage("/images/default-profile.png");
    toast.error("Failed to load profile image");
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
    <div
      className={`fixed inset-y-0 z-50 hidden md:flex flex-col bg-black/20 backdrop-blur-xl border-r border-white/10 shadow-xl transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-purple-400" />
          <span
            className={`font-bold text-lg text-white transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Rudraksha Store
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-gray-200 hover:bg-white/10"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu className="h-5 w-5 text-white/70 hover:bg-white/10 hover:text-white" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <NavLinks
          isSidebarOpen={isSidebarOpen}
          pathname={pathname}
          admin={admin}
        />
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={displayImage}
              alt={admin?.email ?? "Profile"}
              onError={handleImageError}
            />
            <AvatarFallback className="bg-purple-600">
              {isLoading ? "..." : admin?.email?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div
            className={`min-w-0 flex-1 transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
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
    </div>
  );
};

export default SideBar;
