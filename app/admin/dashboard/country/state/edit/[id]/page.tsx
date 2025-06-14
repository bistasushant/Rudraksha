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
import { ICountryResponse, IProvinceResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FormErrors {
  stateName: string;
  country: string;
  general: string;
}

const EditStateForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const params = useParams();
  const stateId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [stateName, setStateName] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<ICountryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    stateName: "",
    country: "",
    general: "",
  });

  // Redirect if not authorized
  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/country/state");
    }
  }, [admin, router]);

  // Fetch state and countries
  useEffect(() => {
    if (
      !admin?.token ||
      !["admin", "editor"].includes(admin.role) ||
      !stateId
    ) {
      if (!stateId) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No state or province ID provided in URL",
        }));
        router.push("/admin/dashboard/country/state");
      }
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch state data
        const stateResponse = await fetch(`/api/province/${stateId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!stateResponse.ok) {
          const errorData = await stateResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch state or province"
          );
        }

        const stateResult = await stateResponse.json();
        const state: IProvinceResponse = stateResult.data;
        if (!state) {
          throw new Error("State or province not found");
        }
        setStateName(state.name || "");
        setSelectedCountryId(state.countryId || "");
        setIsActive(state.isActive ?? true);

        // Fetch countries
        const countriesResponse = await fetch("/api/country", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!countriesResponse.ok) {
          const errorData = await countriesResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch countries");
        }

        const countriesResult = await countriesResponse.json();
        setCountries(countriesResult.data?.countries || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error
              ? error.message
              : "Failed to load state or province data",
        }));
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load state or province data",
          { description: "Redirecting to state or province list." }
        );
        router.push("/admin/dashboard/country/state");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [admin, stateId, router]);

  // Handle click outside for country dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "stateName":
        if (!value.trim()) {
          error = "State or Province name cannot be empty.";
        } else if (!validateName(value)) {
          error = "State or Province name is invalid.";
        }
        break;
      case "country":
        if (!value) {
          error = "A country must be selected.";
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
    if (field === "stateName") {
      setStateName(value);
    }

    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCountrySelect = (countryId: string) => {
    setSelectedCountryId(countryId);
    setIsCountryDropdownOpen(false);
    const error = validateField("country", countryId);
    setFormErrors((prev) => ({ ...prev, country: error }));
  };

  const handleCountryClear = () => {
    setSelectedCountryId("");
    const error = validateField("country", "");
    setFormErrors((prev) => ({ ...prev, country: error }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
      stateName: validateField("stateName", stateName),
      country: validateField("country", selectedCountryId),
      general: "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit state or province.");
      router.push("/admin/dashboard/country/state");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: stateName.trim(),
      countryId: selectedCountryId,
      isActive,
    };

    try {
      const res = await fetch(`/api/province/${stateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to update state or province."
        );
      }

      toast.success("State or Province updated successfully!");
      router.push("/admin/dashboard/country/state");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error(errorMessage);
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase().trim())
  );

  if (!admin?.token || !["admin", "editor"].includes(admin.role) || isLoading) {
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
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit State or Province: {stateName || "Loading..."}
      </h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2 bg-white/10" />
              <Skeleton className="h-10 w-1/2 bg-white/10" />
              <Skeleton className="h-10 w-1/2 bg-white/10" />
              <Skeleton className="h-8 w-1/4 bg-white/10" />
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-24 bg-white/10" />
                <Skeleton className="h-10 w-24 bg-white/10" />
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h3 className="text-lg font-bold text-white">
                State or Province Details
              </h3>
              <div className="space-y-2">
                <Label className="text-white/80">State/Province Name *</Label>
                <Input
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.stateName ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Enter state or province name"
                  value={stateName}
                  onChange={(e) => handleInputChange(e, "stateName")}
                  onBlur={(e) => handleBlur(e, "stateName")}
                  disabled={isSubmitting}
                />
                {formErrors.stateName && (
                  <p className="text-red-500 text-sm">{formErrors.stateName}</p>
                )}
              </div>
              <div className="space-y-2" ref={countryDropdownRef}>
                <Label className="text-white/80">Country *</Label>
                <div className="relative">
                  <button
                    type="button"
                    className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${
                      formErrors.country
                        ? "border-red-500 border"
                        : "border-white/20"
                    }`}
                    onClick={() =>
                      setIsCountryDropdownOpen(!isCountryDropdownOpen)
                    }
                    disabled={isSubmitting}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedCountryId ? (
                        <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center">
                          {countries.find(
                            (country) => country.id === selectedCountryId
                          )?.name || "Unknown Country"}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCountryClear();
                            }}
                            className="ml-1 text-white/80 hover:text-white cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </span>
                        </span>
                      ) : (
                        <span className="text-white/50">Select a country</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-white/50 transition-transform ${
                        isCountryDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isCountryDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input
                          placeholder="Search countries..."
                          value={countrySearchTerm}
                          onChange={(e) => setCountrySearchTerm(e.target.value)}
                          className="bg-white/5 border-white/20 text-white w-full"
                          disabled={isSubmitting}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {countries.length === 0 ? (
                        <div className="px-4 py-2 text-white/70">
                          Loading countries...
                        </div>
                      ) : filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                              selectedCountryId === country.id
                                ? "bg-purple-600/70"
                                : ""
                            }`}
                            onClick={() => handleCountrySelect(country.id)}
                          >
                            <span>{country.name}</span>
                            {selectedCountryId === country.id && (
                              <span className="text-green-400">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-white/70">
                          No countries found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.country && (
                  <p className="text-red-500 text-sm">{formErrors.country}</p>
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
                  {isSubmitting ? "Updating..." : "Update State or Province"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditStateForm;
