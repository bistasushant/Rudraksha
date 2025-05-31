"use client";
import { useEffect, useState } from "react";
import { BarChart3, CreditCard, ShoppingBag, Package, TrendingUp, Star, Gift, Sparkles, Zap, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  percentageChange?: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: number;
  colorFrom: string;
  colorTo: string;
  delay?: number;
}

export default function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
  });
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        setIsLoading(true);
        const token = localStorage?.getItem("token") ?? localStorage?.getItem("authToken");
        const storedUsername = localStorage?.getItem("username");

        if (storedUsername) {
          setUsername(storedUsername);
        }

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("/api/customer/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch order stats: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.message ?? "Failed to fetch order stats");
        }
        setStats(data.data);
      } catch (error) {
        console.error("Error fetching order stats:", error);

      } finally {
        setIsLoading(false);
      }
    };

    // Simulate API delay for demo
    setTimeout(() => {
      fetchOrderStats();
    }, 1500);
  }, []);

  const StatCard = ({ title, value, icon: Icon, description, trend, colorFrom, colorTo, delay = 0 }: StatCardProps) => (
    <Card
      className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl bg-gradient-to-r from-white/25 to-[#1C1C1C] dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-700 hover:scale-[1.03] hover:-translate-y-2 cursor-pointer"
      style={{
        animationDelay: `${delay}ms`,
        animation: 'slideUp 0.8s ease-out forwards',
        opacity: 0,
        transform: 'translateY(30px)'
      }}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-0 group-hover:opacity-10 transition-all duration-500`} />

      {/* Floating orbs */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-full blur-2xl opacity-20 group-hover:scale-150 group-hover:opacity-30 transition-all duration-700`} />
      <div className={`absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br ${colorTo} ${colorFrom} rounded-full blur-xl opacity-10 group-hover:scale-125 transition-all duration-500`} />

      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 relative z-10">
        <div className="space-y-2">
          <CardTitle className="text-sm font-semibold text-ivoryWhite dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
            {title}
          </CardTitle>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 w-fit relative overflow-hidden`}>
            <Icon className="h-7 w-7 text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-2 rounded-full backdrop-blur-sm border border-emerald-200/50 group-hover:scale-105 transition-transform duration-300">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-bold">+{trend}%</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div className={`text-4xl font-black bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
            {value}
          </div>
          <p className="text-sm text-ivoryWhite dark:text-gray-400 font-medium">
            {description}
          </p>
        </div>
      </CardContent>

      {/* Magical shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1500" />
      </div>

      {/* Subtle glow border */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colorFrom} ${colorTo} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 -z-10`}
        style={{ transform: 'scale(1.05)' }} />
    </Card>
  );

  const WelcomeCard = () => (
    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-[#D4AF37] via-purple-[#D4AF37] to-[#8B1A1A] text-white hover:shadow-[#D4AF37]/25 transition-all duration-500 hover:scale-[1.01] cursor-pointer"
      style={{
        animation: 'slideUp 0.8s ease-out forwards',
        opacity: 0,
        transform: 'translateY(30px)'
      }}>
      {/* Dynamic background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-24 -translate-y-24 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-36 translate-y-36 animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />

        {/* Floating particles */}
        <Sparkles className="absolute top-8 right-16 h-6 w-6 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Star className="absolute top-20 left-20 h-4 w-4 text-white/20 animate-bounce" style={{ animationDelay: '1s' }} />
        <Heart className="absolute bottom-20 right-20 h-5 w-5 text-white/25 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <Zap className="absolute bottom-32 left-32 h-4 w-4 text-white/20 animate-ping" style={{ animationDelay: '2s' }} />
      </div>

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-[#F5F5DC] to-indigo-100 bg-clip-text text-transparent">
              Welcome back, {username || "Guest"}! ✨
            </CardTitle>
            <CardDescription className="text-indigo-100 text-lg font-medium">
              Your personal command center awaits
            </CardDescription>
          </div>
          <div className="hidden md:flex space-x-3">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce border border-white/20">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse border border-white/20" style={{ animationDelay: '0.5s' }}>
              <Star className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3 group">
            <p className="text-white/70 text-base font-semibold">Total Orders</p>
            <p className="text-4xl md:text-5xl font-black group-hover:scale-105 transition-transform duration-300">{stats.totalOrders}</p>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="w-12 h-2 bg-gradient-to-r from-white to-indigo-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 group">
            <p className="text-white/70 text-base font-semibold">Total Spent</p>
            <p className="text-4xl md:text-5xl font-black group-hover:scale-105 transition-transform duration-300">
              Rs. {(stats.totalSpent ?? 0).toLocaleString()}
            </p>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="w-14 h-2 bg-gradient-to-r from-white to-pink-200 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Magical gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );

  const LoadingSpinner = () => (
    <div className="space-y-6 md:mt-20">
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin absolute top-2 left-2"
              style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin absolute top-4 left-4"
              style={{ animationDuration: '1.2s' }} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300 animate-pulse">
              Loading your beautiful dashboard...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preparing something amazing ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!stats || stats.totalOrders === undefined) {
    return (
      <div className="space-y-6 md:mt-10">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-xl">
              <Package className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                Oops! Something went wrong
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Unable to load your dashboard. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:mt-20 mt-24 relative">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Welcome Card */}
      <WelcomeCard />

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 relative z-10">
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Package}
          description="Awaiting delivery"
          trend={stats.pendingOrders > 0 ? 12 : undefined}
          colorFrom="from-amber-500"
          colorTo="to-orange-600"
          delay={100}
        />

        <StatCard
          title="Delivered"
          value={stats.deliveredOrders}
          icon={ShoppingBag}
          description="Successfully delivered"
          trend={87}
          colorFrom="from-emerald-400"
          colorTo="to-teal-600"
          delay={200}
        />

        <StatCard
          title="Success Rate"
          value={stats.totalOrders > 0
            ? `${((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)}%`
            : "0%"
          }
          icon={BarChart3}
          description="Order completion rate"
          trend={stats.totalOrders > 0 ? 23 : undefined}
          colorFrom="from-blue-500"
          colorTo="to-indigo-600"
          delay={300}
        />

        <StatCard
          title="Avg. Order Value"
          value={stats.totalOrders > 0
            ? `Rs. ${(stats.totalSpent / stats.totalOrders).toFixed(0)}`
            : "Rs. 0"
          }
          icon={CreditCard}
          description="Average per order"
          trend={15}
          colorFrom="from-purple-500"
          colorTo="to-pink-600"
          delay={400}
        />
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}