"use client";
import { useState } from "react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BiEnvelope } from "react-icons/bi";
import { validateEmail } from "@/lib/validation";

export const EmailSettings = () => {
  const { updateEmail } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token missing");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/users/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update email");
      }

      toast.success("Email updated successfully");
      updateEmail(email);
      setEmail("");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email",
        {
          description: "Please try again later.",
        }
      );
      console.error(
        "Update Email Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <label className="text-white/80 flex items-center gap-2">
          <BiEnvelope className="text-xl" />
          New Email Address
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter new email"
          className="bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 lg:w-[400px]"
          required
        />
      </div>
      <Button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 text-white w-full lg:w-[400px]"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Email"}
      </Button>
    </form>
  );
};
