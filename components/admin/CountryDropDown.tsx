"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe, Earth, Satellite, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

// Updated settings options with icons
const countryOptions = [
  {
    label: "Country",
    value: "country",
    icon: <Earth className="w-4 h-4 mr-2" />,
  },
  {
    label: "Province/State",
    value: "state",
    icon: <Satellite className="w-4 h-4 mr-2" />,
  },
  {
    label: "City",
    value: "city",
    icon: <Building2 className="w-4 h-4 mr-2" />,
  },
];

const CountryDropDown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <div className="relative inline-block text-left w-full">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-3 py-2 text-white/70 hover:text-purple-400 rounded-lg transition-all"
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5" />
          <span className="transition-opacity duration-300">Country</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="z-10 mx-5 text-white"
          >
            {countryOptions.map((option) => {
              const href = `/admin/dashboard/country/${option.value}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={option.value}
                  href={href}
                  className={`mt-0.5 flex items-center gap-3 mb-1 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${isActive ? "border border-purple-500" : ""
                    }`}
                >
                  {option.icon}
                  {option.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountryDropDown;
