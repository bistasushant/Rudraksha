// currency-context.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the context
interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  exchangeRates: { [key: string]: number }; // Example: { USD: 1, CNY: 7.3, INR: 80.5 }
}

// Create the context
const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

// Create the CurrencyProvider component
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR"); // Default currency
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>(
    {
      USD: 1, // Example of exchange rate, adjust as needed
      CNY: 7.16,
      INR: 85.5,
      NPR: 135.0, // Example
    }
  );

  return (
    <CurrencyContext.Provider
      value={{ selectedCurrency, setSelectedCurrency, exchangeRates }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Create the hook to access the context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
