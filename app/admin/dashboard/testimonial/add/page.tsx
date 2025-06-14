"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  fullName: string;
  address: string;
  rating: number;
  description: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  image: string;
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

const AddTestimonialForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    fullName: "",
    address: "",
    rating: 1,
    description: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: "",
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
      toast.error("Please log in to add testimonial.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add testimonial.");
      router.push("/admin/dashboard/testimonial");
    }
  }, [admin, router]);


  const validateField = (
    fieldName: string,
    value: string | number | string[] | null
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
          error = "Testimonial heading cannot be empty.";
        } else if (value.trim().length < 3) {
          error = "Testimonial heading must be at least 3 characters long.";
        }
        break;
      case "rating":
        if (value === null || value === "" || value === undefined) {
          error = "Testimonial rating is required.";
        } else if (typeof value === "string" || typeof value === "number") {
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
        if (typeof value !== "string" || !value) {
          error = "Testimonial image is required.";
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
    setFormValues((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleRichTextChange = (html: string) => {
    setFormValues((prev) => ({ ...prev, description: html }));
    const error = validateField("description", html);
    setFormErrors((prev) => ({ ...prev, description: error }));
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setFormValues((prev) => ({ ...prev, image: imageData }));
        const error = validateField("image", imageData);
        setFormErrors((prev) => ({ ...prev, image: error }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormValues((prev) => ({ ...prev, image: "" })); // Changed to set empty string
    const error = validateField("image", "");
    setFormErrors((prev) => ({ ...prev, image: error }));
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

    return !Object.values(errors).some((error) => error);
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      fullName: "",
      address: "",
      rating: 1,
      description: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: "",
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
      toast.error("You do not have permission to add testimonial.");
      router.push("/admin/dashboard/testimonial");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      fullName: formValues.fullName.trim(),
      slug: generateSlug(formValues.fullName.trim()),
      address: formValues.address.trim(),
      rating: formValues.rating,
      description: formValues.description.trim(),
      seoTitle: formValues.seoTitle.trim(),
      metaDescription: formValues.metaDescription.trim(),
      metaKeywords: formValues.metaKeywords.trim(),
      image: formValues.image,
    };
    try {
      const response = await fetch("/api/testimonial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to add testimonial.");
      }

      toast.success("Testimonial added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/testimonial");
    } catch (error) {
      console.error("Add Testimonial Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while adding the testimonial.";
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New Testimonial</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                <h3 className="text-lg font-bold text-white">Testimonial Details</h3>
                <div className="space-y-2">
                  <Label className="text-white/80">Testimonial Image *</Label>
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
                          <span className="text-sm text-white/50">
                            PNG, JPG (max. 2MB)
                          </span>
                        </>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                    />
                    {formErrors.image && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.image}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/80">Full Name *</Label>
                    <Input
                      name="fullName"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.fullName
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter blog name"
                      required
                      value={formValues.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.fullName && (
                      <p className="text-red-500 text-sm">
                        {formErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Address *</Label>
                    <Input
                      name="address"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.address
                        ? "border-red-500"
                        : "border-white/20"
                        }`}
                      placeholder="Enter Address"
                      required
                      value={formValues.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-sm">
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Rating *</Label>
                    <Input
                      type="number"
                      name="rating"
                      min="1"
                      max="5"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.rating ? "border-red-500" : "border-white/20"
                        }`}
                      placeholder="Enter rating (1-5)"
                      required
                      value={formValues.rating}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.rating && (
                      <p className="text-red-500 text-sm">
                        {formErrors.rating}
                      </p>
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
                      <p className="text-red-500 text-sm">
                        {formErrors.description}
                      </p>
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
                    <p className="text-red-500 text-sm">
                      {formErrors.seoTitle}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Meta Description</Label>
                  <Textarea
                    name="metaDescription"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${formErrors.metaDescription
                      ? "border-red-500"
                      : "border-white/20"
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
                    <p className="text-red-500 text-sm">
                      {formErrors.metaDescription}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Meta Keywords</Label>
                  <Input
                    name="metaKeywords"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${formErrors.metaKeywords
                      ? "border-red-500"
                      : "border-white/20"
                      }`}
                    placeholder="Enter meta keywords (comma-separated, max 10)"
                    value={formValues.metaKeywords}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  {formErrors.metaKeywords && (
                    <p className="text-red-500 text-sm">
                      {formErrors.metaKeywords}
                    </p>
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
                {isSubmitting ? "Adding..." : "Add Testimonial"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTestimonialForm;
