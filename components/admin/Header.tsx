"use client";
import { LogOut, Search, Settings } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Header = () => {
  const router = useRouter();
  const { logout, admin, isLoading } = useAuth();

  const [displayImage, setDisplayImage] = useState(
    admin?.image || "/images/default-profile.png"
  );

  const handleImageError = () => {
    setDisplayImage("/images/default-profile.png");
    toast.error("Failed to load profile image");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const handleSetting = () => {
    router.push("/admin/dashboard/setting");
  };

  useEffect(() => {
    if (!isLoading && admin) {
      const imageUrl =
        admin.image && admin.image !== ""
          ? admin.image.replace(/^\/public\//, "/")
          : "/images/default-profile.png";
      setDisplayImage(imageUrl);
    } else if (!isLoading && !admin) {
      setDisplayImage("/images/default-profile.png");
    }
  }, [admin, isLoading]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="flex h-full items-center pl-[56px] pr-4 md:px-6">
        <div className="flex flex-1 items-center gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full bg-white/5 border-white/10 pl-8 text-white placeholder:text-white/50 focus-visible:ring-purple-500 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src={displayImage}
                    alt={admin?.name || "Profile"}
                    onError={handleImageError}
                  />
                  <AvatarFallback className="bg-purple-600">
                    {isLoading ? "..." : admin?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
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
                <Settings className="mr-2 h-4 w-4" />
                <span className="text-white/70">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-white/70">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
