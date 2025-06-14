"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Admin {
  email: string;
  name: string;
  role: "admin" | "editor" | "user";
  token?: string;
  image?: string;
  contactNumber?: string;
}
interface AuthContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string; token?: string }>;
  logout: () => Promise<void>;
  updateEmail: (newEmail: string) => void;
  isLoading: boolean;
}
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!data.error) {
        const adminData = {
          email: data.data.email,
          name: data.data.name,
          role: data.data.role,
          token: data.data.token,
          image: data.data.image || "",
          contactNumber: data.data.contactNumber || "",
        };
        // Store admin data in localStorage
        localStorage.setItem("user", JSON.stringify(adminData));
        localStorage.setItem("authToken", data.data.token);

        setAdmin(adminData);
        return { success: true, token: data.data.token };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  };
  const logout = async () => {
    try {
      // Clear all authentication data
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("accountType");
      // Reset admin state
      setAdmin(null);
      // Redirect to home page
      window.location.href = "/admin";
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed");
    }
  };
  const updateEmail = (newEmail: string) => {
    if (admin) {
      const updatedAdmin = { ...admin, email: newEmail };
      setAdmin(updatedAdmin);
      localStorage.setItem("user", JSON.stringify(updatedAdmin));
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        if (storedUser && token) {
          const parsedUser: Admin = JSON.parse(storedUser);
          if (
            parsedUser.email &&
            parsedUser.name &&
            parsedUser.role &&
            parsedUser.token === token
          ) {
            setAdmin(parsedUser);
            if (window.location.pathname === "/admin") {
              router.push("/admin/dashboard");
            }
          } else {
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
          }
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);
  return (
    <AuthContext.Provider
      value={{ admin, setAdmin, login, logout, updateEmail, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
