// PasswordSettings.tsx
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "sonner";

export const PasswordSettings = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if(!token) {
        toast.error("Authentication token missing");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if(response.ok){
        toast.success(data.message || "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
      } else{
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An error occurred while changing the password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-white/80 flex items-center gap-2">
            Old Password
          </label>
          <div className="relative lg:w-[400px]">
            <Input
              type={showPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-white/5 border border-white/10 text-white pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-white/70 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>
        </div>
        <label className="text-white/80 flex items-center gap-2">
            New Password
          </label>
          <div className="relative lg:w-[400px]">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/5 border border-white/10 text-white pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-white/70 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>
      </div>
      <Button 
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 text-white w-full lg:w-[400px]"
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Change Password'}
      </Button>
    </form>
  );
};