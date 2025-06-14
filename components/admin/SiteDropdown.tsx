"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Settings as SettingsIcon,
  Image as LogoIcon,
  Type as TitleIcon,
  BarChart3 as AnalyticsIcon,
  Phone as ContactIcon,
  Info as AboutIcon,
  DollarSign as PriceIcon,
  Heading,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

// Updated settings options with icons
const settingsOptions = [
  { label: "Logo", value: "logo", icon: <LogoIcon className="w-4 h-4 mr-2" /> },
  {
    label: "Title",
    value: "title",
    icon: <TitleIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "Google Analytics",
    value: "googleanalytics",
    icon: <AnalyticsIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "Contact Us",
    value: "contact",
    icon: <ContactIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "About Us",
    value: "about",
    icon: <AboutIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "Set Price",
    value: "setprice",
    icon: <PriceIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "Hero Section",
    value: "hero",
    icon: <Heading className="w-4 h-4 mr-2" />,
  },
];

const SiteSettingsDropdown = () => {
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
          <SettingsIcon className="h-5 w-5" />
          <span className="transition-opacity duration-300">Site Settings</span>
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
            {settingsOptions.map((option) => {
              const href = `/admin/dashboard/sitesetting/${option.value}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={option.value}
                  href={href}
                  className={`mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 ${isActive ? "border border-purple-500" : ""
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

export default SiteSettingsDropdown;
