"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  userRole: string | null;
  userId: string | null;
  setAuthState: (
    username: string | null,
    userRole: string | null,
    userId: string | null
  ) => void;
  logout: () => void;
  isAdmin: boolean;
  adminToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Check if user has admin privileges
  const isAdmin = userRole === "admin" || userRole === "editor" || userRole === "user";

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const storedAdminToken = localStorage.getItem("adminToken");

    if (storedUsername && token) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setUserRole(storedRole);
      setUserId(storedUserId);

      // If we have an admin token, set it in state
      if (storedAdminToken) {
        setAdminToken(storedAdminToken);
      }
    }
  }, []);

  // Function to update auth state when user logs in
  const setAuthState = (
    newUsername: string | null,
    newUserRole: string | null,
    newUserId: string | null
  ) => {
    setUsername(newUsername);
    setUserRole(newUserRole);
    setUserId(newUserId);
    setIsAuthenticated(!!newUsername && !!localStorage.getItem("token"));

    // Handle admin authentication
    if (newUserRole === "admin" || newUserRole === "editor" || newUserRole === "user") {
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.setItem("authToken", token);
        const adminData = {
          email: localStorage.getItem("email") || "",
          name: newUsername || "",
          role: newUserRole,
          token: token,
          image: localStorage.getItem("image") || "",
          contactNumber: localStorage.getItem("contactNumber") || "",
        };
        localStorage.setItem("user", JSON.stringify(adminData));
      }
    }
  };

  // Enhanced logout function that also clears admin tokens
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("cart");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("image");
    localStorage.removeItem("contactNumber");

    setIsAuthenticated(false);
    setUsername(null);
    setUserRole(null);
    setUserId(null);
    setAdminToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        userRole,
        userId,
        setAuthState,
        logout,
        isAdmin,
        adminToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};