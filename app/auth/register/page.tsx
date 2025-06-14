"use client";
import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    contactNumber: string;
    general: string;
  }>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Validation function
  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "name":
        if (!value?.trim()) {
          error = "Name cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Name must be at least 3 characters.";
        }
        break;
      case "email":
        if (!value?.trim()) {
          error = "Email cannot be empty.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = "Please enter a valid email address (e.g., user@domain.com).";
        }
        break;
      case "password":
        if (!value) {
          error = "Password cannot be empty.";
        } else if (value.length < 8) {
          error = "Password must be at least 8 characters long.";
        } else if (!/^[A-Z]/.test(value)) {
          error = "Password must start with a capital letter.";
        } else if (!/[0-9]/.test(value)) {
          error = "Password must include at least one number.";
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          error = "Password must include at least one special character.";
        }
        break;
      case "confirmPassword":
        if (!value) {
          error = "Confirm password cannot be empty.";
        } else if (value !== formData.password) {
          error = "Passwords do not match.";
        }
        break;
      case "contactNumber":
        if (!value?.trim()) {
          error = "Contact number cannot be empty.";
        } else if (!/^\+?[\d\s-]{9,15}$/.test(value.trim())) {
          error =
            "Phone number must be 9-15 digits, optionally starting with +";
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
      confirmPassword: validateField(
        "confirmPassword",
        formData.confirmPassword
      ),
      contactNumber: validateField("contactNumber", formData.contactNumber),
      general: "",
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
      // Re-validate confirmPassword if password changes
      confirmPassword:
        field === "password"
          ? validateField("confirmPassword", formData.confirmPassword)
          : prev.confirmPassword,
    }));
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    const value = formData[field];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          contactNumber: formData.contactNumber.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Account created successfully! Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          contactNumber: "",
        });
        setErrors({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          contactNumber: "",
          general: "",
        });
        router.push("/auth/login");
      } else {
        const errorMessage = data.message || "Registration failed.";
        if (response.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: "Email already exists.",
            general: errorMessage,
          }));
        } else {
          setErrors((prev) => ({ ...prev, general: errorMessage }));
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      const errorMessage =
        "An unexpected error occurred. Please try again later.";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-[#1C1C1C] via-gray-900 to-[#1C1C1C] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-ivoryWhite mb-2 transform hover:scale-105 transition-all">
              Join Our Community
            </h2>
            <p className="text-ivoryWhite font-medium">
              Create your free account now
            </p>
          </div>
          <div className="bg-deepGraphite rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl border border-[#B87333]/30 hover:border-[#B87333]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-md font-medium text-ivoryWhite mb-1">
                    Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      onBlur={() => handleBlur("name")}
                      className={`w-full px-4 py-3 text-ivoryWhite border rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] transition-all ${errors.name ? "border-red-500" : "border-gray-200"
                        }`}
                      placeholder="Your Name"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-ivoryWhite"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-md font-medium text-ivoryWhite mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      onBlur={() => handleBlur("email")}
                      className={`w-full px-4 py-3 border text-ivoryWhite rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] transition-all ${errors.email ? "border-red-500" : "border-ivoryWhite"
                        }`}
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-ivoryWhite"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <label className="block text-md font-medium text-ivoryWhite mb-1">
                      Password *
                    </label>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      onBlur={() => handleBlur("password")}
                      className={`w-full px-4 py-3 text-ivoryWhite border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.password ? "border-red-500" : "border-gray-200"
                        }`}
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-10 text-ivoryWhite hover:text-[#8B1A1A] transition-colors"
                      disabled={isSubmitting}
                    >
                      {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-md font-medium text-ivoryWhite mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`w-full px-4 py-3 text-ivoryWhite border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.confirmPassword
                        ? "border-red-500"
                        : "border-ivoryWhite"
                        }`}
                      placeholder="Enter your password again"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="absolute right-3 top-10 text-ivoryWhite hover:text-[#8B1A1A] transition-colors"
                      disabled={isSubmitting}
                    >
                      {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-md font-medium text-ivoryWhite mb-1">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text" // Changed to text for strict digit validation
                      value={formData.contactNumber}
                      onChange={(e) =>
                        handleInputChange("contactNumber", e.target.value)
                      }
                      onBlur={() => handleBlur("contactNumber")}
                      className={`w-full px-4 py-3 text-ivoryWhite border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${errors.contactNumber
                        ? "border-red-500"
                        : "border-gray-200"
                        }`}
                      placeholder="Enter phone number (8–15 digits, e.g., +977-9801234567)"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-ivoryWhite"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {errors.general && (
                <p className="text-sm text-red-600">{errors.general}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#8B1A1A] to-[#D4AF37] hover:from-[#600000] hover:to-[#D4AF37] text-ivoryWhite font-semibold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <p className="mt-6 text-center text-md text-ivoryWhite">
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="font-medium text-md text-brassGold hover:underline hover:text-[#8B1A1A]"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </section>
      <Toaster position="bottom-right" />
    </>
  );
};

export default RegisterForm;
