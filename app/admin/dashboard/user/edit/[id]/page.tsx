"use client";
import { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AdminRole;
}

const EditUserPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    general: string;
  }>({
    name: "",
    email: "",
    contactNumber: "",
    role: "",
    general: "",
  });
  const [userData, setUserData] = useState<UserProfile>({
    id: "",
    email: "",
    name: "",
    contactNumber: "",
    role: "user" as AdminRole,
  });

  const router = useRouter();
  const params = useParams();
  const userEmail =
    typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const { admin } = useAuth();

  // Memoize the roles array to prevent re-creation on every render
  const roles: AdminRole[] = useMemo(() => ["admin", "editor", "user"], []);

  // Validation function
  const validateField = useCallback(
    (
      name: string,
      value: string | { value: string; role?: AdminRole } | AdminRole,
      roleForContactNumber: AdminRole = userData.role
    ) => {
      let error = "";
      switch (name) {
        case "name":
          if (typeof value === "string" && !value.trim()) {
            error = "Name cannot be empty.";
          } else if (typeof value === "string" && value.trim().length < 3) {
            error = "Name must be at least 3 characters long.";
          }
          break;
        case "email":
          if (typeof value === "string" && !value.trim()) {
            error = "Email cannot be empty.";
          } else if (
            typeof value === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ) {
            error =
              "Please enter a valid email address (e.g., user@domain.com).";
          }
          break;
        case "contactNumber":
          const contactValue =
            typeof value === "string" ? value : value?.value || "";
          const validationRole =
            typeof value === "object" && value.role
              ? value.role
              : roleForContactNumber;
          if (validationRole === "user" && !contactValue.trim()) {
            error = "Contact number is required for user role.";
          } else if (
            contactValue.trim() &&
            !/^\d{10}$/.test(contactValue.trim())
          ) {
            error = "Contact number must be exactly 10 digits.";
          }
          break;
        case "role":
          if (!value || !roles.includes(value as AdminRole)) {
            error = "Please select a valid role.";
          }
          break;
        default:
          break;
      }
      return error;
    },
    [userData.role, roles]
  );

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail || !admin?.token) {
        toast.error("Invalid user email or not authenticated");
        router.push("/admin/dashboard/user");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/users/profiles?email=${encodeURIComponent(userEmail)}`,
          {
            headers: {
              Authorization: `Bearer ${admin.token}`,
            },
          }
        );

        const data = await response.json();
        console.log("API Response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user data");
        }

        if (!data.data?.users || !Array.isArray(data.data.users) || data.data.users.length === 0) {
          throw new Error("No user data received");
        }

        const user = data.data.users[0];
        setUserData({
          id: user.id || user._id,
          email: user.email || "",
          name: user.name || "",
          contactNumber: user.contactNumber || "",
          role: user.role || "user",
        });

        // Validate initial form data
        setFormErrors({
          name: validateField("name", user.name || ""),
          email: validateField("email", user.email || ""),
          contactNumber: validateField("contactNumber", {
            value: user.contactNumber || "",
            role: user.role || "user",
          }),
          role: validateField("role", user.role || "user"),
          general: "",
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch user data"
        );
        router.push("/admin/dashboard/user");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userEmail, admin, router, validateField, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleRoleChange = (role: AdminRole) => {
    setUserData((prev) => ({ ...prev, role }));
    const roleError = validateField("role", role);
    const contactError = validateField(
      "contactNumber",
      userData.contactNumber,
      role
    );
    setFormErrors((prev) => ({
      ...prev,
      role: roleError,
      contactNumber: contactError,
    }));
  };

  // Validate entire form before submission
  const validateForm = () => {
    const errors = {
      name: validateField("name", userData.name),
      email: validateField("email", userData.email),
      contactNumber: validateField("contactNumber", userData.contactNumber),
      role: validateField("role", userData.role),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!admin?.token || admin.role !== "admin") {
      toast.error("Only admins can update user profiles");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix form errors");
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        contactNumber: userData.contactNumber.trim() || undefined,
        role: userData.role,
      };

      const response = await fetch(`/api/users/profiles/${userData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      console.log("Update Response:", data);

      if (!response.ok) {
        if (response.status === 400 && data.message?.includes("customer")) {
          toast.error(
            "Cannot update customers here. Use the customer management page."
          );
        } else if (response.status === 409) {
          setFormErrors((prev) => ({
            ...prev,
            general: "Email already exists",
          }));
          toast.error("Email already exists");
        } else {
          throw new Error(data.message || "Failed to update user");
        }
        return;
      }

      toast.success("User updated successfully");
      router.push("/admin/dashboard/user");
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      setFormErrors((prev) => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Edit User: {userData.name || "Loading..."}</h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
          <CardHeader>
            <h2 className="text-lg font-bold text-white">User Details</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">User Role *</Label>
                  <Select
                    value={userData.role}
                    onValueChange={handleRoleChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className={`bg-white/5 text-white ${formErrors.role ? "border-red-500" : "border-white/20"
                        } focus:ring-2 focus:ring-purple-500`}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/20 text-white">
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-red-400 text-sm">{formErrors.role}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">User Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter user name"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white ${formErrors.name ? "border-red-500" : "border-white/20"
                      }`}
                    required
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-sm">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter email"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white ${formErrors.email ? "border-red-500" : "border-white/20"
                      }`}
                    required
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-sm">{formErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="text"
                    value={userData.contactNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter contact number (10 digits, required for user role)"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white ${formErrors.contactNumber
                      ? "border-red-500"
                      : "border-white/20"
                      }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.contactNumber && (
                    <p className="text-red-400 text-sm">
                      {formErrors.contactNumber}
                    </p>
                  )}
                </div>
              </div>
              {formErrors.general && (
                <p className="text-red-400 text-sm">{formErrors.general}</p>
              )}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditUserPage;
