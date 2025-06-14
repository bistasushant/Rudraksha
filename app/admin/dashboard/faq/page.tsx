import FaqList from "@/components/admin/faq/FaqList";
import FaqImageManager from "@/components/admin/faq/FaqImageManager";
import React from "react";

export default function FaqPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          FAQ Management
        </h1>
        <p className="text-white/70">
          Manage your FAQ content and header image.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
        <p className="text-sm text-white/60 font-medium">
          Recommended size: 1280 x 720 pixels
        </p>
      </div>
      <FaqImageManager />
     
      <FaqList />
    </div>
  );
}
