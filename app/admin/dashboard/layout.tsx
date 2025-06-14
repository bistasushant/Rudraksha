"use client"; // Mark as client component
import NextTopLoader from "nextjs-toploader";
import { useAuth } from "../providers/AuthProviders";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideBar from "@/components/admin/SideBar";
import MobileSideBar from "@/components/admin/MobileSideBar";
import Header from "@/components/admin/Header";
import { AuthProvider } from "../providers/AuthProviders";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}

function DashboardLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Protect the dashboard route
  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/");
    }
  }, [admin, isLoading, router]);


  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950">
      <NextTopLoader color="#C16AFB" />

      {/* Desktop Sidebar */}
      <SideBar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Mobile Sidebar */}
      <MobileSideBar />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        {/* Sticky Header */}
        <Header />

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
