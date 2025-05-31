"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

const PaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const paymentsData = [
    {
      id: "#PAY-001",
      orderId: "#ORD-001",
      amount: 1299.0,
      method: "Credit Card",
      status: "Completed",
      date: "2023-10-01",
    },
    {
      id: "#PAY-002",
      orderId: "#ORD-002",
      amount: 1199.0,
      method: "PayPal",
      status: "Pending",
      date: "2023-10-02",
    },
    {
      id: "#PAY-003",
      orderId: "#ORD-003",
      amount: 249.0,
      method: "Debit Card",
      status: "Failed",
      date: "2023-10-03",
    },
    {
      id: "#PAY-004",
      orderId: "#ORD-004",
      amount: 599.0,
      method: "Credit Card",
      status: "Completed",
      date: "2023-10-04",
    },
    {
      id: "#PAY-005",
      orderId: "#ORD-005",
      amount: 399.0,
      method: "Bank Transfer",
      status: "Completed",
      date: "2023-10-05",
    },
  ];

  // Define filteredCustomers
  const filteredPayments = paymentsData.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "All" || payment.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2 text-white/50" />
          <Input
            type="text"
            placeholder="Search by payment ID or order ID..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-4 flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
              <Filter size={16} />
              <span className="font-normal">{filter}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900/90 text-white">
            <DropdownMenuItem onClick={() => setFilter("All")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("Completed")}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("Pending")}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("Failed")}>
              Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Payment Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70 text-md">
                  Payment ID
                </TableHead>
                <TableHead className="text-white/70 text-md">
                  Order ID
                </TableHead>
                <TableHead className="text-white/70 text-md">Amount</TableHead>
                <TableHead className="text-white/70 text-md">Method</TableHead>
                <TableHead className="text-white/70 text-md">Status</TableHead>
                <TableHead className="text-white/70 text-md">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="text-white/70 text-md">
                    {payment.id}
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    {payment.orderId}
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    {payment.method}
                  </TableCell>
                  {/* <TableCell className={`text-white/70 text-md 
                                                ${payment.status === "Completed" ? "text-green-500" : 
                                                payment.status === "Pending" ? "text-yellow-500" : 
                                                "text-red-500"}`}>{payment.status}
                                            </TableCell> */}
                  <TableCell>
                    <Badge
                      className={`
                                                ${
                                                  payment.status === "Completed"
                                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                    : payment.status ===
                                                      "Pending"
                                                    ? "bg-yellow-500/20 text-yellow-400  hover:bg-yellow-500/30"
                                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                }`}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    {payment.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination className="mt-3">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis className="text-white/60 hover:bg-gray-500/20 hover:text-white/80" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaymentPage;
