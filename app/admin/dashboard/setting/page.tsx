"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BiEnvelope, BiLock, BiImageAdd } from "react-icons/bi";

import { EmailSettings } from "@/components/admin/EmailSetting";
import { PasswordSettings } from "@/components/admin/PasswordSetting";
import { ImageSettings } from "@/components/admin/ImageSetting";

const Setting = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    "email" | "password" | "image"
  >("email");

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
      <h1 className="text-2xl font-bold text-white mb-6">Admin Settings</h1>

      <div className="flex flex-col md:flex-row gap-2 mb-8 lg:w-[400px]">
        <Button
          onClick={() => setActiveSection("email")}
          className={`flex-1 gap-2 ${
            activeSection === "email"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <BiEnvelope className="text-xl" />
          Email Settings
        </Button>
        <Button
          onClick={() => setActiveSection("password")}
          className={`flex-1 gap-2 ${
            activeSection === "password"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <BiLock className="text-xl" />
          Password
        </Button>
        <Button
          onClick={() => setActiveSection("image")}
          className={`flex-1 gap-2 ${
            activeSection === "image"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <BiImageAdd className="text-xl" />
          Profile Image
        </Button>
      </div>

      {activeSection === "email" && <EmailSettings />}
      {activeSection === "password" && <PasswordSettings />}
      {activeSection === "image" && <ImageSettings />}
    </div>
  );
};

export default Setting;
