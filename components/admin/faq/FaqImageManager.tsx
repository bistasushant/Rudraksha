"use client";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const FaqImageManager = () => {
  const { admin } = useAuth();
  const [currentImage, setCurrentImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchCurrentImage = useCallback(async () => {
    try {
      const response = await fetch("/api/faq/image", {
        headers: {
          Authorization: `Bearer ${admin?.token}`,
        },
      });
      const result = await response.json();
      if (!result.error && result.data?.image) {
        const imagePath = result.data.image.startsWith('/') 
          ? result.data.image 
          : `/${result.data.image}`;
        setCurrentImage(imagePath);
      }
    } catch (error) {
      console.error("Error fetching FAQ image:", error);
    }
  }, [admin?.token]);

  useEffect(() => {
    if (admin?.token) {
      fetchCurrentImage();
    }
  }, [admin?.token, fetchCurrentImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/faq/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${admin?.token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Failed to upload image");
      }

      toast.success(result.message);
      setSelectedFile(null);
      fetchCurrentImage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return "Uploading...";
    return currentImage ? "Update Image" : "Add Image";
  };

  return (
    <Card className="max-w-6xl mx-auto bg-white/5 border-white/10 shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white/70">
          FAQ Header Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentImage && (
            <div className="relative w-full h-48 mb-4">
              <Image
                src={currentImage}
                alt="FAQ Header"
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-md p-2"
            />
            <Button
              type="submit"
              disabled={loading || !selectedFile}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {getButtonText()}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaqImageManager; 