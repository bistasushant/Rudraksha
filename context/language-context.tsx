// language-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useCurrency } from "./currency-context"; // Import the useCurrency hook to access the currency context

export type LanguageKey = "english" | "chinese" | "hindi" | "nepali";

interface LanguageContextType {
  selectedLanguage: LanguageKey;
  setSelectedLanguage: (language: LanguageKey) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: "english",
  setSelectedLanguage: () => {},
});

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageKey>("english");
  const { setSelectedCurrency } = useCurrency(); // Access the currency setter

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as LanguageKey;
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Store the selected language in localStorage
    localStorage.setItem("language", selectedLanguage);

    // Set the currency based on the selected language
    switch (selectedLanguage) {
      case "chinese":
        setSelectedCurrency("CNY");
        break;
      case "hindi":
        setSelectedCurrency("INR");
        break;
      case "nepali":
        setSelectedCurrency("NPR");
        break;
      default:
        setSelectedCurrency("USD");
    }
  }, [selectedLanguage, setSelectedCurrency]);

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
