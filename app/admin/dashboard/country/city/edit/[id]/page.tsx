"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { validateName } from "@/lib/validation";
import { ICityResponse, IProvinceResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FormErrors {
  cityName: string;
  province: string;
  shippingCost: string;
  general: string;
}

const EditCityForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const params = useParams();
  const cityId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [cityName, setCityName] = useState("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<IProvinceResponse[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false);
  const [provinceSearchTerm, setProvinceSearchTerm] = useState("");
  const provinceDropdownRef = useRef<HTMLDivElement>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    cityName: "",
    province: "",
    shippingCost: "",
    general: "",
  });

  // Redirect if not authorized
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/country/city");
    }
  }, [admin, router]);

  // Fetch provinces
  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;

    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const response = await fetch("/api/province", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch provinces");
        }

        const result = await response.json();
        setProvinces(result.data?.provinces || []);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setFormErrors((prev) => ({
          ...prev,
          general: "Failed to load provinces.",
        }));
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [admin]);

  // Fetch city data
  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role) || !cityId) {
      if (!cityId) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No city ID provided in URL",
        }));
        router.push("/admin/dashboard/country/city");
      }
      return;
    }

    const fetchCity = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/city/${cityId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch city");
        }

        const result = await response.json();
        const city: ICityResponse = result.data;
        if (!city) {
          throw new Error("City not found");
        }
        setCityName(city.name || "");
        setSelectedProvinceId(city.provinceId || "");
        setShippingCost(city.shippingCost ?? 0);
        setIsActive(city.isActive ?? true);
      } catch (error) {
        console.error("Error fetching city:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error ? error.message : "Failed to load city data",
        }));
        toast.error(
          error instanceof Error ? error.message : "Failed to load city data",
          {
            description: "Redirecting to city list.",
          }
        );
        router.push("/admin/dashboard/country/city");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCity();
  }, [admin, cityId, router]);

  // Handle click outside for province dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        provinceDropdownRef.current &&
        !provinceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProvinceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateField = (name: string, value: string | number): string => {
    let error = "";
    switch (name) {
      case "cityName":
        if (!value) {
          error = "City name cannot be empty.";
        } else if (!validateName(value as string)) {
          error = "City name is invalid.";
        }
        break;
      case "province":
        if (!value) {
          error = "A state or province must be selected.";
        }
        break;
      case "shippingCost":
        if (value === "" || isNaN(Number(value))) {
          error = "Shipping cost must be a valid number.";
        } else if (Number(value) < 0) {
          error = "Shipping cost cannot be negative.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const { value } = e.target;
    if (field === "cityName") {
      setCityName(value);
      setFormErrors((prev) => ({
        ...prev,
        cityName: validateField(field, value),
      }));
    } else if (field === "shippingCost") {
      const numericValue = value === "" ? 0 : Number(value);
      setShippingCost(numericValue);
      setFormErrors((prev) => ({
        ...prev,
        shippingCost: validateField(field, numericValue),
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    if (field === "shippingCost") {
      const numericValue = value === "" ? 0 : Number(value);
      setFormErrors((prev) => ({
        ...prev,
        shippingCost: validateField(field, numericValue),
      }));
    } else {
      setFormErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setIsProvinceDropdownOpen(false);
    setFormErrors((prev) => ({
      ...prev,
      province: validateField("province", provinceId),
    }));
  };

  const handleProvinceClear = () => {
    setSelectedProvinceId("");
    setFormErrors((prev) => ({
      ...prev,
      province: validateField("province", ""),
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
      cityName: validateField("cityName", cityName),
      province: validateField("province", selectedProvinceId),
      shippingCost: validateField("shippingCost", shippingCost),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to update cities.");
      router.push("/admin/dashboard/country/city");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: cityName.trim(),
      provinceId: selectedProvinceId,
      shippingCost,
      isActive,
    };

    try {
      const res = await fetch(`/api/city/${cityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update city.");
      }

      toast.success("City updated successfully!");
      router.push("/admin/dashboard/country/city");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(errorMessage);
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter provinces based on search term
  const filteredProvinces = provinces.filter((province) =>
    province.name
      .toLowerCase()
      .includes(provinceSearchTerm.toLowerCase().trim())
  );

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
          disabled={isSubmitting || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit City: {cityName || "Loading..."}
      </h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-8 w-1/4 bg-white/10" />
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-24 bg-white/10" />
                <Skeleton className="h-10 w-24 bg-white/10" />
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold text-white">City Details</h3>
              <div className="space-y-2">
                <Label className="text-white/80">City Name *</Label>
                <Input
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.cityName ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Enter city name"
                  value={cityName}
                  onChange={(e) => handleInputChange(e, "cityName")}
                  onBlur={(e) => handleBlur(e, "cityName")}
                  disabled={isSubmitting}
                />
                {formErrors.cityName && (
                  <p className="text-red-500 text-sm">{formErrors.cityName}</p>
                )}
              </div>
              <div className="space-y-2" ref={provinceDropdownRef}>
                <Label className="text-white/80">State/Province *</Label>
                <div className="relative">
                  <button
                    type="button"
                    className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${
                      formErrors.province
                        ? "border-red-500 border"
                        : "border-white/20"
                    }`}
                    onClick={() =>
                      setIsProvinceDropdownOpen(!isProvinceDropdownOpen)
                    }
                    disabled={isSubmitting}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedProvinceId ? (
                        <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center">
                          {
                            provinces.find(
                              (province) => province.id === selectedProvinceId
                            )?.name
                          }
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProvinceClear();
                            }}
                            className="ml-1 text-white/80 hover:text-white cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </span>
                        </span>
                      ) : (
                        <span className="text-white/50">
                          Select a state/province
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-white/50 transition-transform ${
                        isProvinceDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isProvinceDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input
                          placeholder="Search provinces..."
                          value={provinceSearchTerm}
                          onChange={(e) =>
                            setProvinceSearchTerm(e.target.value)
                          }
                          className="bg-white/5 border-white/20 text-white w-full"
                          disabled={isSubmitting}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {loadingProvinces ? (
                        <div className="px-4 py-2 text-white/70">
                          Loading provinces...
                        </div>
                      ) : filteredProvinces.length > 0 ? (
                        filteredProvinces.map((province) => (
                          <div
                            key={province.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                              selectedProvinceId === province.id
                                ? "bg-purple-600/70"
                                : ""
                            }`}
                            onClick={() => handleProvinceSelect(province.id)}
                          >
                            <span>{province.name}</span>
                            {selectedProvinceId === province.id && (
                              <span className="text-green-400">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-white/70">
                          No provinces found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.province && (
                  <p className="text-red-500 text-sm">{formErrors.province}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Shipping fCost *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.shippingCost
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter shipping cost"
                  value={shippingCost === 0 ? "" : shippingCost}
                  onChange={(e) => handleInputChange(e, "shippingCost")}
                  onBlur={(e) => handleBlur(e, "shippingCost")}
                  disabled={isSubmitting}
                />
                {formErrors.shippingCost && (
                  <p className="text-red-500 text-sm">
                    {formErrors.shippingCost}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Set Status</Label>
                <div className="flex items-center">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <Label className="text-white/80">
                    {isActive ? "Active" : "Inactive"}
                  </Label>
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
                  {isSubmitting ? "Updating..." : "Update City"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCityForm;
