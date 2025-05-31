"use client";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "./providers/AuthProviders";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <NextTopLoader color="#C16AFB" />
      {children}
    </AuthProvider>
  );
}
