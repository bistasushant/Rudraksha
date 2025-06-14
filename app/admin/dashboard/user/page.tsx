"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole, ApiResponse } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/useDebounce";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  image?: string;
  contactNumber?: string;
  createdAt?: string;
}

const UserPage = () => {
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const debouncedUserSearchTerm = useDebounce(userSearchTerm, 1000);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { admin } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!admin?.token) {
          toast.error("Please log in to view users");
          router.push("/admin");
          return;
        }

        setLoading(true);
        const response = await fetch("/api/users/profiles", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profiles");
        }

        setUsers(Array.isArray(data.data?.users) ? data.data.users : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch profiles",
          {
            description: "Please try again later.",
          }
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [admin, router]);

  // Filter and sort users
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(debouncedUserSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedUserSearchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30";
      case "editor":
        return "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30";
      case "user":
        return "bg-green-500/20 text-green-400 hover:bg-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30";
    }
  };

  const handleEdit = (email: string) => {
    if (admin?.role !== "admin") {
      toast.error("Only admins can edit users");
      return;
    }
    router.push(`/admin/dashboard/user/edit/${encodeURIComponent(email)}`);
  };

  const handleDelete = (user: UserProfile) => {
    if (admin?.role !== "admin") {
      toast.error("Only admins can delete users");
      return;
    }

    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!admin?.token || !selectedUser) {
      toast.error("Not authenticated or no user selected");
      return;
    }
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ targetEmail: selectedUser }),
      });

      const data: ApiResponse = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.message?.includes("customer")) {
          throw new Error(
            "Cannot delete customers here. Use the customer management page."
          );
        } else if (response.status === 404) {
          throw new Error("User not found");
        } else if (response.status === 403) {
          throw new Error("Only admins can delete users");
        }
        throw new Error(data.message || "Failed to delete user");
      }

      setUsers(users.filter((user) => user.id !== selectedUser.id));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  const renderSkeletonRows = () =>
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-8 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 bg-white/10" />
            <Skeleton className="h-8 w-8 bg-white/10" />
          </div>
        </TableCell>
      </TableRow>
    ));

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 text-white/50" />
              <Input
                type="text"
                placeholder="Search Users..."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <span>Sort by Name</span>
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  Descending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {admin?.role === "admin" && (
            <Button
              onClick={() => router.push("/admin/dashboard/user/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add User</span>
            </Button>
          )}
        </div>
        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Users List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">ID</TableHead>
                    <TableHead className="text-white/70 text-md">
                      User Name
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Image
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Email
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Phone Number
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Role
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Date
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    renderSkeletonRows()
                  ) : sortedUsers.length > 0 ? (
                    sortedUsers.map((user, index) => (
                      <TableRow
                        key={user.email}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="text-white/70 text-md">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                Array.isArray(user.image)
                                  ? user.image[0]?.replace("/public", "") ||
                                  "/images/placeholder.png"
                                  : user.image?.replace("/public", "") ||
                                  "/images/placeholder.png"
                              }
                              alt={`${user.name}'s profile image`}
                            />
                            <AvatarFallback className="bg-purple-600">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {user.contactNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          <Badge className={getRoleBadgeClass(user.role)}>
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-400/20"
                              onClick={() => handleEdit(user.email)}
                              disabled={admin?.role !== "admin"}
                            >
                              <span className="text-blue-500">
                                <Pencil />
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-400/20"
                              onClick={() => handleDelete(user)}
                              disabled={admin?.role !== "admin"}
                            >
                              <span className="text-red-500">
                                <Trash2 />
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-white/70"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 text-white border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. You are about to permanently delete
              the user <strong>{selectedUser?.name || "this user"}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white/10 hover:bg-white/20 text-white border-white/10"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserPage;
