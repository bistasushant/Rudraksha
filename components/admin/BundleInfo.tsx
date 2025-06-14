import { AnimatePresence, motion } from "framer-motion";
import { BookX, ChevronDown, DiamondPercent, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const bundleOptions = [
  {
    label: "Banner",
    value: "banner",
    icon: <BookX className="w-4 h-4 mr-2" />,
  },
  {
    label: "Package",
    value: "package",
    icon: <Package className="w-4 h-4 mr-2" />,
  },
];

const BundleDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <div className="relative w-full">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-3 py-2 text-white/70 hover:text-purple-400 rounded-lg transition-all"
      >
        <div className="flex items-center gap-3">
          <DiamondPercent className="h-5 w-5" />
          <span className="transition-opacity duration-300">Bundle Info</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full pl-8 mt-1 text-white rounded-xl overflow-hidden"
          >
            {bundleOptions.map((option) => {
              const href = `/admin/dashboard/${option.value}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={option.value}
                  href={href}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 mr-1 text-white/70 transition-all hover:text-purple-400 ${
                    isActive ? "border border-purple-500" : ""
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
export default BundleDropdown;