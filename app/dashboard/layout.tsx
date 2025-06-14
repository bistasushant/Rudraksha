"use client";

import Dashboard from "@/components/Dashboard";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Dashboard />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] dark:via-gray-900/30">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
