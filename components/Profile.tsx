"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  User,
  Loader2,
  AlertCircle,
  Save,
  Edit3,
  Phone,
  Mail,
  X,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";


interface UserProfile {
  email: string;
  name: string;
  role: string;
  image?: string | null;
  contactNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [profileUpdateErrors, setProfileUpdateErrors] = useState<{
    name?: string;
    contactNumber?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to format image URL
  const formatImageUrl = (url: string | null | undefined) => {
    if (!url) return "";
    return url.startsWith("/public") ? url.substring(7) : url;
  };

  const { isAuthenticated } = useAuth();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const storedToken = localStorage.getItem('token')
      const storedRole = localStorage.getItem('role')
      
      if (!storedToken || !storedRole) {
        toast.error("Please log in to view your profile")
        setIsFetching(false)
        return
      }

      setIsFetching(true)
      try {
        const response = await fetch("/api/customer/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        })
        const data = await response.json()
        if (!data.error && data.data) {
          const profileData = data.data
          setUser(profileData)
          setFormData({
            name: profileData.name || "",
            email: profileData.email || "",
            contactNumber: profileData.contactNumber || "",
            image: profileData.image || "",
          })
        } else {
          toast.error(data.message || "Failed to fetch profile")
          // Don't clear form data on error
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to fetch profile")
        // Don't clear form data on error
      } finally {
        setIsFetching(false)
      }
    }
    fetchProfile()
  }, []) // Remove isAuthenticated and token dependencies

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setProfileUpdateErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    if (name === "email") {
      setEmailError(null);
    }
  };

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Drag and drop handlers
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/gif"
      ) {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        toast.error("Only JPEG, PNG, and GIF images are allowed");
      }
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors: { name?: string; contactNumber?: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (
      formData.contactNumber &&
      !/^\+?[\d\s\-()]{7,15}$/.test(formData.contactNumber.trim())
    ) {
      errors.contactNumber = "Invalid phone number format";
    }
    setProfileUpdateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update (name and contact number)
  const handleProfileUpdate = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!validateProfileForm()) {
      return;
    }

    if (!isAuthenticated || !token) {
      toast.error("Please log in to update your profile");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          contactNumber: formData.contactNumber || null,
        }),
      });
      const data = await response.json();
      if (!data.error) {
        setUser((prev) => ({
          ...prev!,
          name: formData.name,
          contactNumber: formData.contactNumber || null,
        }));
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };


  // Handle image upload
  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error("No image selected");
      return;
    }

    if (!isAuthenticated || !token) {
      toast.error("Please log in to upload an image");
      return;
    }

    setLoading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("image", imageFile);

    try {
      const response = await fetch("/api/customer/change-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });
      const data = await response.json();
      if (!data.error) {
        const imageUrl = data.data?.image;
        setUser((prev) => ({
          ...prev!,
          image: imageUrl || prev?.image || null,
        }));
        setImageFile(null);
        setImagePreview(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        toast.success("Profile image updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6 p-6 bg-white rounded-lg shadow-lg max-w-3xl mx-auto opacity-75">
      <div className="flex items-center space-x-6">
        <div className="rounded-full bg-indigo-100 h-32 w-32" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-indigo-100 rounded w-1/2" />
          <div className="h-6 bg-indigo-100 rounded w-3/4" />
          <div className="h-6 bg-indigo-100 rounded w-2/3" />
        </div>
      </div>
      <div className="h-6 bg-indigo-100 rounded w-1/3" />
    </div>
  );

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  // Show empty state if no user data
  if (!user) {
    return (
      <div className="min-h-screen md:mt-16">
        <div className="container mx-auto max-w-4xl">
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-[#600000]/20 backdrop-blur-xl border border-white/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B1A1A]/20 via-[#D4AF37]/20 to-[#B87333]/20"></div>
            <div className="relative p-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#B87333] via-[#D4AF37] to-[#8B1A1A] bg-clip-text text-transparent mb-2">
                Profile
              </h1>
              <p className="text-ivoryWhite text-lg">Please log in to view your profile</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:mt-16">
      <div className="container mx-auto max-w-4xl">
        {/* Floating header with glassmorphism */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-[#600000]/20 backdrop-blur-xl border border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B1A1A]/20 via-[#D4AF37]/20 to-[#B87333]/20"></div>
          <div className="relative p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/40">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              <span className="text-sm font-medium text-ivoryWhite">Premium Profile</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#B87333] via-[#D4AF37] to-[#8B1A1A] bg-clip-text text-transparent mb-2">
              Your Profile
            </h1>
            <p className="text-ivoryWhite text-lg">Manage your personal details with style</p>
          </div>
        </div>

        {/* Main profile card */}
        <div className="relative overflow-hidden rounded-3xl bg-charcoalBlack shadow-2xl border border-gray-100">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Avatar Section */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-brassGold mb-2">Profile Photo</h3>
                    <p className="text-[#D4AF37]/90 text-sm">Upload your best photo</p>
                  </div>

                  {/* Avatar container with enhanced styling */}
                  <div
                    className={`relative group cursor-pointer transition-all duration-500 ${dragActive
                      ? "scale-105 shadow-2xl"
                      : "hover:scale-105 hover:shadow-xl"
                      }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500 via-green-500 to-blue-500 opacity-75 animate-pulse"></div>
                    <div className="relative m-1 rounded-3xl bg-white p-6">
                      <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-purple-100">
                        {imagePreview || user?.image ? (
                          <Image
                            src={imagePreview || `${formatImageUrl(user.image)}?t=${new Date().getTime()}`}
                            alt={user?.name || "User"}
                            fill
                            className="object-cover"
                            priority
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-6xl font-bold text-indigo-300">
                              {user?.name?.[0] || "U"}
                            </div>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-[#D4AF37]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Camera className="h-8 w-8 mx-auto mb-2 animate-bounce text-[#1C1C1C]/70" />
                            <p className="text-sm font-medium text-[#1C1C1C]/70">
                              {dragActive ? "Drop it here!" : "Change Photo"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleImageChange}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </div>
                  </div>

                  {/* Upload controls */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={!isEditing || loading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B1A1A]/80 to-[#D4AF37]/70 text-white font-medium hover:from-[#8B1A1A] hover:to-[#D4AF37] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 shadow-lg"
                    >
                      <Camera className="inline-block mr-2 h-4 w-4" />
                      Choose New Photo
                    </button>

                    {imageFile && (
                      <button
                        onClick={handleImageUpload}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        {loading ? (
                          <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="inline-block mr-2 h-4 w-4" />
                        )}
                        Upload Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-ivoryWhite">Personal Information</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-ivoryWhite mb-2 block">Full Name</span>
                      <div className="relative">
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 bg-[#2A2A2A]/50 text-ivoryWhite backdrop-blur-sm text-gray-800 font-medium"
                          placeholder="Enter your full name"
                        />
                        {!isEditing && (
                          <div className="absolute inset-y-0 right-4 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      {profileUpdateErrors.name && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {profileUpdateErrors.name}
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-ivoryWhite">Contact Details</h3>
                  </div>

                  <div className="grid gap-6 md:grid-cols-1">
                    <label className="block">
                      <span className="text-sm font-medium text-ivoryWhite mb-2 block">Email Address</span>
                      <div className="relative">
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          className="w-full px-4 py-4 rounded-xl text-ivoryWhite border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-[#2A2A2A]/50 backdrop-blur-sm text-gray-800 font-medium"
                          placeholder="Enter your email"
                        />
                        <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ivoryWhite" />
                      </div>
                      {emailError && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {emailError}
                        </p>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-ivoryWhite mb-2 block">Phone Number</span>
                      <div className="relative">
                        <input
                          name="contactNumber"
                          type="tel"
                          value={formData.contactNumber || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          className="w-full px-4 py-4 rounded-xl border-2 text-ivoryWhite border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-200 bg-[#2A2A2A]/50 backdrop-blur-sm text-gray-800 font-medium"
                          placeholder="Enter your phone number"
                        />
                        <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ivoryWhite" />
                      </div>
                      {profileUpdateErrors.contactNumber && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {profileUpdateErrors.contactNumber}
                        </p>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-[#2A2A2A]/80 backdrop-blur-xl border-t border-gray-100 p-6">
            <div className="flex justify-end gap-4">
              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || "",
                      email: user.email || "",
                      contactNumber: user.contactNumber || "",
                      image: user.image || "",
                    });
                    setProfileUpdateErrors({});
                    setEmailError(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl border-2 bg-white/70 border-gray-300 text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                >
                  <X className="inline-block mr-2 h-4 w-4" />
                  Cancel
                </button>
              )}
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#B87333]/70 via-[#D4AF37]/70 to-[#8B1A1A]/70 text-white font-medium hover:from-[#B87333] hover:via-[#D4AF37] hover:to-[#8B1A1A] transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Save className="inline-block mr-2 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="inline-block mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}