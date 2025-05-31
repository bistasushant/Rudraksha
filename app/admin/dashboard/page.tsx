"use client";
import Stats from "@/components/admin/Stats";
import Chart from "@/components/admin/Chart";
import OrderProduct from "@/components/admin/OrderProduct";

export default function DashbaordPage() {
  return (
    <>
      <Stats />
      <Chart />
      <OrderProduct />
    </>
  );
}
