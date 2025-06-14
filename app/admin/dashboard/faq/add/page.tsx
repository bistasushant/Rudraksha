"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  question: string;
  answer: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

interface FormErrors {
  question: string;
  answer: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  general: string;
}

const AddFaqForm: React.FC = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    question: "",
    answer: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    question: "",
    answer: "",
    seoTitle: "",
    metaDescription: "",
    metaKeywords: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add FAQ.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add FAQ.");
      router.push("/admin/dashboard/faq");
    }
  }, [admin, router]);

  const validateQuestion = (value: string): string => {
    if (!value.trim()) return "Question cannot be empty.";
    if (value.trim().length < 3) return "Question must be at least 3 characters long.";
    return "";
  };

  const validateAnswer = (value: string): string => {
    if (!value.trim()) return "Answer cannot be empty.";
    if (value.trim().length < 10) return "Answer must be at least 10 characters long.";
    return "";
  };

  const validateSeoTitle = (value: string): string => {
    if (value.trim() && value.length > 60) return "SEO title must be 60 characters or less.";
    return "";
  };

  const validateMetaDescription = (value: string): string => {
    if (value.trim() && value.length > 160) return "Meta description must be 160 characters or less.";
    return "";
  };

  const validateMetaKeywords = (value: string): string => {
    if (value.trim()) {
      const keywords = value.split(",").map(kw => kw.trim()).filter(Boolean);
      if (keywords.length > 10) return "Meta keywords must not exceed 10 keywords.";
    }
    return "";
  };

  const validateField = (
    fieldName: string,
    value: string | number | string[] | null
  ): string => {
    if (typeof value !== "string") return "";
    
    const validators: Record<string, (value: string) => string> = {
      question: validateQuestion,
      answer: validateAnswer,
      seoTitle: validateSeoTitle,
      metaDescription: validateMetaDescription,
      metaKeywords: validateMetaKeywords
    };

    return validators[fieldName]?.(value) || "";
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
    setFormValues((prev) => ({ ...prev, answer: html }));
    const error = validateField("answer", html);
    setFormErrors((prev) => ({ ...prev, answer: error }));
  };

  const validateForm = (): boolean => {
    const errors = {
      question: validateField("question", formValues.question),
      answer: validateField("answer", formValues.answer),
      seoTitle: validateField("seoTitle", formValues.seoTitle),
      metaDescription: validateField("metaDescription", formValues.metaDescription),
      metaKeywords: validateField("metaKeywords", formValues.metaKeywords),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      question: "",
      answer: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
    });
    setFormErrors({
      question: "",
      answer: "",
      seoTitle: "",
      metaDescription: "",
      metaKeywords: "",
      general: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add FAQ.");
      router.push("/admin/dashboard/faq");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      question: formValues.question.trim(),
      slug: generateSlug(formValues.question.trim()),
      answer: formValues.answer.trim(),
      seoTitle: formValues.seoTitle.trim() || formValues.question.trim(),
      metaDescription: formValues.metaDescription.trim() || formValues.answer.trim().substring(0, 160),
      metaKeywords: formValues.metaKeywords.trim()
    };

    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Failed to add FAQ.");
      }

      toast.success("FAQ added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/faq");
    } catch (error) {
      console.error("Add FAQ Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while adding the FAQ.";
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New FAQ</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-7xl mx-auto">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 md:border-r md:border-white/40 md:pr-6">
                <h3 className="text-lg font-bold text-white">FAQ Details</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/80">Question *</Label>
                    <Input
                      name="question"
                      className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                        formErrors.question ? "border-red-500" : "border-white/20"
                      }`}
                      placeholder="Enter your question"
                      required
                      value={formValues.question}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                    />
                    {formErrors.question && (
                      <p className="text-red-500 text-sm">{formErrors.question}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Answer *</Label>
                    <RichTextEditor
                      placeholder="Enter your answer..."
                      value={formValues.answer}
                      onChange={handleRichTextChange}
                    />
                    {formErrors.answer && (
                      <p className="text-red-500 text-sm">{formErrors.answer}</p>
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
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.seoTitle ? "border-red-500" : "border-white/20"
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
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-24 w-full ${
                      formErrors.metaDescription ? "border-red-500" : "border-white/20"
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
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.metaKeywords ? "border-red-500" : "border-white/20"
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
                {isSubmitting ? "Adding..." : "Add FAQ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFaqForm;
