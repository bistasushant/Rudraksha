"use client";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  footerEnglishTexts,
  footerChineseTexts,
  footerHindiTexts,
  footerNepaliTexts,
} from "@/language";
import {
  Leaf,
  Facebook,
  Instagram,
  TwitterIcon,
  YoutubeIcon,
  Mail,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Poppins } from "next/font/google";

// Import Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const Footer = () => {
  const { selectedLanguage } = useLanguage();
  const pathname = usePathname();

  const footerTexts = useMemo(
    () =>
      selectedLanguage === "chinese"
        ? footerChineseTexts
        : selectedLanguage === "hindi"
        ? footerHindiTexts
        : selectedLanguage === "nepali"
        ? footerNepaliTexts
        : footerEnglishTexts,
    [selectedLanguage]
  );

  const navFooter = [
    { id: 1, name: footerTexts.home, path: "/" },
    { id: 2, name: footerTexts.shop, path: "/shop" },
    { id: 3, name: footerTexts.about, path: "/about" },
    { id: 4, name: footerTexts.blog, path: "/blog" },
    { id: 5, name: footerTexts.contact, path: "/contact" },
  ];

  const services = [
    {
      id: 1,
      name: footerTexts.shippingpolicy,
      path: "/customer-service/shipping-policy",
    },
    {
      id: 2,
      name: footerTexts.returnrefunds,
      path: "/customer-service/returns-refunds",
    },
    { id: 3, name: footerTexts.Faqs, path: "/customer-service/faqs" },
    {
      id: 4,
      name: footerTexts.privacypolicy,
      path: "/customer-service/privacy-policy",
    },
    {
      id: 5,
      name: footerTexts.termsconditon,
      path: "/customer-service/terms-condition",
    },
  ];

  const logos = [
    {
      id: 1,
      social: <Facebook />,
      label: "Facebook",
      url: "https://facebook.com",
    },
    {
      id: 2,
      social: <Instagram />,
      label: "Instagram",
      url: "https://instagram.com",
    },
    {
      id: 3,
      social: <TwitterIcon />,
      label: "Twitter",
      url: "https://twitter.com",
    },
    {
      id: 4,
      social: <YoutubeIcon />,
      label: "YouTube",
      url: "https://youtube.com",
    },
  ];

  const handleSubscribe = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    alert("Thanks for subscribing! 🎉");
  };

  return (
    <footer
      key={pathname}
      className={`bg-gradient-to-r from-gray-900 to-indigo-900 text-white py-8 ${poppins.className}`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center">
              <Leaf className="h-6 w-6 text-green-400" />
              <span className="ml-2 text-2xl hover:text-green-400 transition-transform hover:scale-110 focus:ring-2 focus:ring-green-500 focus:outline-none font-bold tracking-wider">
                {footerTexts.rudraksha}
              </span>
            </Link>
            <p className="text-md font-bold text-gray-300 max-w-xs">
              {footerTexts.h1}
            </p>
            <div className="flex space-x-4">
              {logos.map((logo) => (
                <a
                  key={logo.id}
                  href={logo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-transform hover:scale-110 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  aria-label={logo.label}
                >
                  {logo.social}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 hover:text-green-400 transition-transform hover:scale-105 cursor-pointer">
              {footerTexts.h2}
            </h3>
            <ul className="space-y-2">
              {navFooter.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className="text-white hover:text-green-400 transition-transform hover:scale-105 text-md"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 hover:text-green-400 transition-transform hover:scale-105 cursor-pointer">
              {footerTexts.customerservice}
            </h3>
            <ul className="space-y-0.5">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={service.path}
                    className="text-white hover:text-green-400 transition-transform hover:scale-105 text-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-2 hover:text-green-400 transition-transform hover:scale-105 cursor-pointer">
              {footerTexts.h3}
            </h3>
            <p className="text-md text-gray-300 mb-4">{footerTexts.h4}</p>
            <form onSubmit={handleSubscribe} className="flex space-x-2">
              <div className="relative flex-grow max-w-[200px] w-full">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder={footerTexts.yourEmail}
                  className="pl-10 py-2 text-sm w-full border rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-green-400 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-transform hover:scale-105 cursor-pointer"
              >
                {footerTexts.subscribe}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} {footerTexts.copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
