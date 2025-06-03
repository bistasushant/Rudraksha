"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderDetail from "@/components/OrderDetail";

export default function OrderPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="md:mt-10">
      <OrderDetail />
    </div>
  );
} 