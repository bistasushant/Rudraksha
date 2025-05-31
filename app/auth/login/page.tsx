// components/LoginClient.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";

// Separate component that uses searchParams
function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/";
  const { setAuthState } = useAuth();
  const { clearCart, resetCartState } = useCart();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (token && username) {
      setAuthState(username, role, userId);
      resetCartState();
      clearCart().catch((err) =>
        console.error("Clear cart error on mount:", err)
      );
      if (returnUrl !== "/") {
        router.push(returnUrl);
      }
    }
  }, [returnUrl, router, setAuthState, resetCartState, clearCart]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const loginData = {
        email: email.trim(),
        password,
      };

      let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      });

      let accountType = "admin";
      if (response.status === 401) {
        response = await fetch("/api/customer/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(loginData),
        });
        accountType = "customer";
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error("Unexpected server response format: " + text);
      }

      if (response.ok && data?.data?.token) {
        const userData = data.data;

        const userId = userData._id || userData.id || userData.userId;
        if (!userId) {
          throw new Error("Login failed: user ID is missing from response.");
        }

        const role = userData.role || (accountType === "customer" ? "customer" : "user");

        // Store all user data
        localStorage.setItem("token", userData.token);
        localStorage.setItem("username", userData.name || userData.email);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("image", userData.image || "");
        localStorage.setItem("contactNumber", userData.contactNumber || "");

        // If admin user, set up admin authentication
        if (role === "admin" || role === "editor" || role === "user") {
          localStorage.setItem("authToken", userData.token);
          const adminData = {
            email: userData.email,
            name: userData.name || userData.email,
            role: role,
            token: userData.token,
            image: userData.image || "",
            contactNumber: userData.contactNumber || "",
          };
          localStorage.setItem("user", JSON.stringify(adminData));
        }

        setAuthState(userData.name || userData.email, role, userId);

        resetCartState();
        await clearCart();

        toast.success("Login Successful!");

        window.dispatchEvent(new Event("storage"));

        // Redirect based on role
        setTimeout(() => {
          // Always redirect to customer page or returnUrl, regardless of role
          window.location.replace(returnUrl !== "/" ? returnUrl : "/");
        }, 1000);
      } else {
        if (response.status === 401) {
          setError("Invalid email or password.");
        } else {
          setError(data?.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Connection error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-ivoryWhite mb-2 transform hover:scale-105 transition-all">
          Welcome Back
        </h2>
        <p className="text-ivoryWhite font-medium">Sign in to your account</p>
        {returnUrl !== "/" && (
          <p className="text-ivoryWhite mt-2">
            You&apos;ll be redirected back after login
          </p>
        )}
      </div>

      <div className="bg-deepGraphite border border-[#B87333]/30 hover:border-[#B87333] rounded-2xl p-8 transition-all duration-300">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
            <span className="text-green-600 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-medium text-ivoryWhite mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border text-ivoryWhite border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] transition-all"
                  placeholder="Enter your email"
                />
                <FaEnvelope className="w-5 h-5 absolute right-3 top-3.5 text-ivoryWhite" />
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-ivoryWhite mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-ivoryWhite border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Enter your password"
                />
                <FaLock className="w-5 h-5 absolute right-3 top-3.5 text-ivoryWhite" />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-10 top-3.5 text-ivoryWhite hover:text-[#8B1A1A] transition-colors"
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] hover:from-[#600000] hover:to-[#D4AF37] text-white font-semibold py-3.5 rounded-lg transition-all duration-300 transform ${isLoading
              ? "opacity-70 cursor-not-allowed"
              : "hover:scale-[1.02] active:scale-95"
              }`}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-lg text-ivoryWhite">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-brassGold text-md hover:underline hover:text-purple-500 transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </>
  );
}

// Loading fallback for Suspense
function LoginFormFallback() {
  return (
    <div className="text-center py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        <div className="h-64 bg-gray-300 rounded w-full mx-auto mt-8"></div>
      </div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
      <Toaster position="bottom-right" />
    </section>
  );
}
