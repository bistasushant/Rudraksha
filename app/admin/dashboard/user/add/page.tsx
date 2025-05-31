"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole } from "@/types";

const AddUserForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("user");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    email: string;
    name: string;
    contactNumber: string;
    password: string;
    confirmPassword: string;
    selectedRole: string;
    general: string;
  }>({
    email: "",
    name: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
    selectedRole: "",
    general: "",
  });

  const roles: AdminRole[] = ["admin", "editor", "user"];

  // Validation function
  const validateField = (name: string, value: string | AdminRole) => {
    let error = "";
    switch (name) {
      case "email":
        if (typeof value === "string" && !value.trim()) {
          error = "Email cannot be empty.";
        } else if (
          typeof value === "string" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ) {
          error = "Please enter a valid email address (e.g., user@domain.com).";
        }
        break;
      case "name":
        if (typeof value === "string" && !value.trim()) {
          error = "Name cannot be empty.";
        } else if (typeof value === "string" && value.trim().length < 3) {
          error = "Name must be at least 3 characters long.";
        }
        break;
      case "contactNumber":
        if (typeof value === "string" && !value.trim()) {
          error = "Phone number cannot be empty.";
        } else if (
          typeof value === "string" &&
          !/^\d{10}$/.test(value.trim())
        ) {
          error = "Phone number must be exactly 10 digits.";
        }
        break;
      case "password":
        if (typeof value === "string" && !value) {
          error = "Password cannot be empty.";
        } else if (typeof value === "string" && value.length < 8) {
          error = "Password must be at least 8 characters long.";
        } else if (typeof value === "string" && !/^[A-Z]/.test(value)) {
          error = "Password must start with a capital letter.";
        } else if (typeof value === "string" && !/[0-9]/.test(value)) {
          error = "Password must include at least one number.";
        } else if (typeof value === "string" && !/[^A-Za-z0-9]/.test(value)) {
          error = "Password must include at least one special character.";
        }
        break;
      case "confirmPassword":
        if (typeof value === "string" && !value) {
          error = "Confirm password cannot be empty.";
        } else if (typeof value === "string" && value !== password) {
          error = "Passwords do not match.";
        }
        break;
      case "selectedRole":
        if (!value || !roles.includes(value as AdminRole)) {
          error = "Please select a valid role.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Handle input change with validation
  const handleInputChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    if (field === "email") setEmail(value);
    if (field === "name") setName(value);
    if (field === "contactNumber") setContactNumber(value);
    if (field === "password") {
      setPassword(value);
      // Re-validate confirmPassword when password changes
      const confirmError = validateField("confirmPassword", confirmPassword);
      setFormErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
    if (field === "confirmPassword") setConfirmPassword(value);

    // Validate on change
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle blur with validation
  const handleBlur = (field: string, e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleRoleSelect = (role: AdminRole) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
    const error = validateField("selectedRole", role);
    setFormErrors((prev) => ({ ...prev, selectedRole: error }));
  };

  // Validate entire form before submission
  const validateForm = () => {
    const errors = {
      email: validateField("email", email),
      name: validateField("name", name),
      contactNumber: validateField("contactNumber", contactNumber),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
      selectedRole: validateField("selectedRole", selectedRole),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token) {
      toast.error("Please log in to add users");
      router.push("/admin");
      setIsSubmitting(false);
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Only admins can add users");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          contactNumber: contactNumber.trim(),
          password,
          confirmPassword,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      toast.success(data.message || "User added successfully");
      router.push("/admin/dashboard/user");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add user";
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New User</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">User Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 relative">
                <Label className="text-white/80">Select Role *</Label>
                <button
                  type="button"
                  className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white ${
                    formErrors.selectedRole
                      ? "border-red-500"
                      : "border-white/20"
                  } focus:ring-2 focus:ring-gray-500`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isSubmitting}
                >
                  <span className="text-white">
                    {selectedRole
                      ? selectedRole.charAt(0).toUpperCase() +
                        selectedRole.slice(1)
                      : "Select role"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {formErrors.selectedRole && (
                  <p className="text-red-500 text-sm">
                    {formErrors.selectedRole}
                  </p>
                )}
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <div
                          key={role}
                          className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                            selectedRole === role ? "bg-purple-600/70" : ""
                          }`}
                          onClick={() => handleRoleSelect(role)}
                        >
                          <span>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                          {selectedRole === role && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-white/70">
                        No roles available
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">User Name *</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => handleInputChange("name", e)}
                  onBlur={(e) => handleBlur("name", e)}
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.name ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Enter user name"
                  required
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e)}
                  onBlur={(e) => handleBlur("email", e)}
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.email ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Enter email"
                  required
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Phone Number *</Label>
                <Input
                  type="text" // Changed to text to enforce exact digit validation
                  value={contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e)}
                  onBlur={(e) => handleBlur("contactNumber", e)}
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.contactNumber
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter phone number (10 digits)"
                  required
                  disabled={isSubmitting}
                />
                {formErrors.contactNumber && (
                  <p className="text-red-500 text-sm">
                    {formErrors.contactNumber}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Password *</Label>
                <div className="relative lg:w-full">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleInputChange("password", e)}
                    onBlur={(e) => handleBlur("password", e)}
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white pr-10 ${
                      formErrors.password ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-sm">{formErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Confirm Password *</Label>
                <div className="relative lg:w-full">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e)}
                    onBlur={(e) => handleBlur("confirmPassword", e)}
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white pr-10 ${
                      formErrors.confirmPassword
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Confirm password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            {formErrors.general && (
              <p className="text-red-500 text-sm">{formErrors.general}</p>
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
                {isSubmitting ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUserForm;
