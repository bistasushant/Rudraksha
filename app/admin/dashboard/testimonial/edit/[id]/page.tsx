"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

interface FormValues {
  id: string;
  fullName: string;
  address: string;
  rating: number;
  description: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string;
  slug: string;
}

interface FormErrors {
  fullName: string;
  address: string;
  rating: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string;
  general: string;
}

const EditTestimonialForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const testimonialSlug = Array.isArray(params.id) ? params.id[0] : params.id;
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    id: "",
    fullName: "",
    address: "",
    rating: 1,
    description: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "",
    slug: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    fullName: "",
    address: "",
    rating: "",
    description: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to edit testimonial.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit testimonial.");
      router.push("/admin/dashboard/testimonial");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/testimonial/${testimonialSlug}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch testimonial");
        }

        const result = await response.json();
        console.log(result)
        const testimonialData = result.data;

        if (!testimonialData || typeof testimonialData !== "object") {
          throw new Error("Testimonial data not found or invalid in response");
        }
        setOriginalSlug(testimonialData.slug || "");
        setFormValues({
          id: testimonialData._id || "",
          fullName: testimonialData.fullName || "",
          address: testimonialData.address || "",
          rating: Number(testimonialData.rating) || 1,
          description: testimonialData.description || "",
          seoTitle: testimonialData.seoTitle || "",
          metaDescription: testimonialData.metaDescription || "",
          metaKeywords: testimonialData.metaKeywords || "",
          image: testimonialData.image || "",
          slug: testimonialData.slug || "",
        });

        // Validate fetched data
        const errors = {
          fullName: validateField("fullName", testimonialData.fullName || ""),
          address: validateField("address", testimonialData.address || ""),
          rating: validateField("rating", Number(testimonialData.rating) || 1),
          description: validateField("description", testimonialData.description || ""),
          seoTitle: validateField("seoTitle", testimonialData.seoTitle || ""),
          metaDescription: validateField("metaDescription", testimonialData.metaDescription || ""),
          metaKeywords: validateField("metaKeywords", testimonialData.metaKeywords || ""),
          image: validateField("image", testimonialData.image || ""),
          general: "",
        };
        setFormErrors(errors);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load data.",
          { description: "Please try again later." }
        );
        router.push("/admin/dashboard/testimonial");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin, testimonialSlug, router]);

  const validateField = (
    fieldName: string,
    value: string | number | null
  ): string => {
    let error = "";

    switch (fieldName) {
      case "fullName":
        if (typeof value !== "string" || !value.trim()) {
          error = "Testimonial name cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Testimonial name must be at least 3 characters long.";
        }
        break;
      case "address":
        if (typeof value !== "string" || !value.trim()) {
          error = "Testimonial address cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Testimonial address must be at least 3 characters long.";
        }
        break;
      case "rating":
        if (value === null || value === "" || value === undefined) {
          error = "Testimonial rating is required.";
        } else {
          const ratingValue = typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(ratingValue)) {
            error = "Testimonial rating must be a valid number.";
          } else if (ratingValue < 1 || ratingValue > 5) {
            error = "Testimonial rating must be between 1 and 5.";
          } else if (!Number.isInteger(ratingValue)) {
            error = "Testimonial rating must be an integer.";
          }
        }
        break;
      case "description":
        if (typeof value !== "string" || !value.trim()) {
          error = "Testimonial description cannot be empty.";
        } else if (value.trim().length < 10) {
          error = "Testimonial description must be at least 10 characters long.";
        }
        break;
      case "seoTitle":
        if (typeof value === "string" && value.trim() && value.length > 60) {
          error = "SEO title must be 60 characters or less.";
        }
        break;
      case "metaDescription":
        if (typeof value === "string" && value.trim() && value.length > 160) {
          error = "Meta description must be 160 characters or less.";
        }
        break;
      case "metaKeywords":
        if (typeof value === "string" && value.trim()) {
          const keywords = value
            .split(",")
            .map((kw) => kw.trim())
            .filter(Boolean);
          if (keywords.length > 10) {
            error = "Meta keywords must not exceed 10 keywords.";
          }
        }
        break;
      case "image":
        if (typeof value === "string" && value && (!value.startsWith("data:image/") || !value.includes(";base64,"))) {
          error = "Invalid image format. Please upload a valid PNG or JPG.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "rating" ? (value ? parseInt(value) : 1) : value,
      ...(name === "fullName" && { slug: generateSlug(value) }),
    }));

    const error = validateField(name, value);
    setFormErrors((prev) => {
      const newErrors = { ...prev, [name]: error };
      return newErrors;
    });
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => {
      const newErrors = { ...prev, [name]: error };
      return newErrors;
    });
  };

  const handleRichTextChange = (html: string) => {
    setFormValues((prev) => ({ ...prev, description: html }));
    const error = validateField("description", html);
    setFormErrors((prev) => {
      const newErrors = { ...prev, description: error };
      return newErrors;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        setFormErrors((prev) => ({
          ...prev,
          image: "File size exceeds 2MB limit.",
        }));
        return;
      }
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        toast.error("Please upload a PNG or JPG image.");
        setFormErrors((prev) => ({
          ...prev,
          image: "Please upload a PNG or JPG image.",
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setFormValues((prev) => ({ ...prev, image: imageData }));
        const error = validateField("image", imageData);
        setFormErrors((prev) => {
          const newErrors = { ...prev, image: error };
          return newErrors;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormValues((prev) => ({ ...prev, image: "" }));
    const error = validateField("image", "");
    setFormErrors((prev) => {
      const newErrors = { ...prev, image: error };
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors = {
      fullName: validateField("fullName", formValues.fullName),
      address: validateField("address", formValues.address),
      rating: validateField("rating", formValues.rating),
      description: validateField("description", formValues.description),
      seoTitle: validateField("seoTitle", formValues.seoTitle),
      metaDescription: validateField("metaDescription", formValues.metaDescription),
      metaKeywords: validateField("metaKeywords", formValues.metaKeywords),
      image: validateField("image", formValues.image),
      general: "",
    };
    setFormErrors(errors);
    const isValid = !Object.values(errors).some((error) => error);
    return isValid;
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      id: "",
      fullName: "",
      address: "",
      rating: 1,
      description: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: "",
      slug: "",
    });
    setFormErrors({
      fullName: "",
      address: "",
      rating: "",
      description: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: "",
      general: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit testimonial.");
      router.push("/admin/dashboard/testimonial");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      const errorFields = Object.entries(formErrors)
        .filter(([, error]) => error)
        .map(([field]) => field)
        .join(", ");
      toast.error(
        `Please fix the following errors: ${errorFields || "Check all required fields"}`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData: Partial<FormValues> = {
        fullName: formValues.fullName.trim(),
        address: formValues.address.trim(),
        rating: formValues.rating,
        description: formValues.description.trim(),
        seoTitle: formValues.seoTitle.trim(),
        metaDescription: formValues.metaDescription.trim(),
        metaKeywords: formValues.metaKeywords.trim(),
        image: formValues.image,
      };
      if (formValues.slug && formValues.slug.trim() !== originalSlug) {
        updateData.slug = formValues.slug.trim();
      }

      const updateEndpoint = originalSlug
        ? `/api/testimonial/${originalSlug}`
        : `/api/testimonial/${formValues.id}`;

      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update testimonial");
      }

      toast.success("Testimonial updated successfully");
      resetForm(form);
      router.push("/admin/dashboard/testimonial");
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update testimonial";
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Edit Testimonial : {formValues.fullName || "Loading"}</h1>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                  <h3 className="text-lg font-bold text-white">Testimonial Details</h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">Testimonial Image (PNG/JPG, max 2MB)</Label>
                    <div className="relative group w-full max-w-md mx-auto">
                      <label
                        htmlFor="image-upload"
                        className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${formErrors.image ? "border-red-500" : "border-white/30"
                          }`}
                      >
                        {formValues.image ? (
                          <div className="relative w-full h-full p-2">
                            <Image
                              src={formValues.image}
                              alt="Testimonial image preview"
                              fill
                              className="object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage();
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-white/50 mb-2 group-hover:text-purple-400" />
                            <span className="text-white/70 group-hover:text-purple-400">
                              Click to upload an image
                            </span>
                            <span className="text-sm text-white/50">PNG, JPG (max 2MB)</span>
                          </>
                        )}
                      </label>
                      <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isSubmitting}
                      />
                      {formErrors.image && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/80">Full Name *</Label>
                      <Input
                        name="fullName"
                        className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.fullName ? "border-red-500" : "border-white/20"
                          }`}
                        placeholder="Enter full name"
                        required
                        value={formValues.fullName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                      />
                      {formErrors.fullName && (
                        <p className="text-red-500 text-sm">{formErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Address *</Label>
                      <Input
                        name="address"
                        className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.address ? "border-red-500" : "border-white/20"
                          }`}
                        placeholder="Enter address"
                        required
                        value={formValues.address}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-sm">{formErrors.address}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Rating *</Label>
                      <select
                        name="rating"
                        className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.rating ? "border-red-500" : "border-white/20"
                          }`}
                        value={formValues.rating}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setFormValues((prev) => ({ ...prev, rating: value }));
                          const error = validateField("rating", value);
                          setFormErrors((prev) => ({ ...prev, rating: error }));
                        }}
                        disabled={isSubmitting}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      {formErrors.rating && (
                        <p className="text-red-500 text-sm">{formErrors.rating}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Description *</Label>
                      <RichTextEditor
                        placeholder="Description..."
                        value={formValues.description}
                        onChange={handleRichTextChange}
                      />
                      {formErrors.description && (
                        <p className="text-red-500 text-sm">{formErrors.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white">SEO Content</h3>
                  <div className="space-y-2">
                    <Label className="text-white/80">SEO Title</Label>
                    <Input
                      name="seoTitle"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.seoTitle ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter SEO title (max 60 characters)"
                      value={formValues.seoTitle}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    <p className="text-white/50 text-sm">
                      {formValues.seoTitle.length}/60 characters
                    </p>
                    {formErrors.seoTitle && (
                      <p className="text-red-500 text-sm">{formErrors.seoTitle}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Meta Description</Label>
                    <Textarea
                      name="metaDescription"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${formErrors.metaDescription ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter meta description (max 160 characters)"
                      value={formValues.metaDescription}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    <p className="text-white/50 text-sm">
                      {formValues.metaDescription.length}/160 characters
                    </p>
                    {formErrors.metaDescription && (
                      <p className="text-red-500 text-sm">{formErrors.metaDescription}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Meta Keywords</Label>
                    <Input
                      name="metaKeywords"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.metaKeywords ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter meta keywords (comma-separated, max 10)"
                      value={formValues.metaKeywords}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.metaKeywords && (
                      <p className="text-red-500 text-sm">{formErrors.metaKeywords}</p>
                    )}
                  </div>
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
                  {isSubmitting ? "Updating..." : "Update Testimonial"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditTestimonialForm;