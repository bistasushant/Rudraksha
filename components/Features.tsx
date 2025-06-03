"use client";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ProductCard } from "./Product-Card";
import { useLanguage } from "@/context/language-context";
import {
  featureEnglishTexts,
  featureChineseTexts,
  featureHindiTexts,
  featureNepaliTexts,
} from "@/language";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string[];
  price: number;
  image?: string;
  images?: string[];
  featured?: boolean;
}
interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}
interface ProductListData {
  products: Product[];
  page?: number;
}

export default function Features() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedLanguage } = useLanguage();
  const featureTexts = {
    chinese: featureChineseTexts,
    hindi: featureHindiTexts,
    nepali: featureNepaliTexts,
    english: featureEnglishTexts,
  }[selectedLanguage] || featureEnglishTexts;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          let errorMsg = `Failed to fetch products: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            console.error(parseError);
            throw new Error();
          }
          if (errorMsg.includes("Failed to fetch")) {
            errorMsg = "Failed to fetch products. Check network/server status.";
          }
          throw new Error(errorMsg);
        }
        const result: ApiResponse<ProductListData> = await response.json();
        if (
          result.error ||
          !result.data ||
          !Array.isArray(result.data.products)
        ) {
          console.error("Invalid API response structure:", result);
          throw new Error("Received invalid data format from API.");
        }
        const products = result.data.products || [];
        const featured = products.filter(
          (product: Product) => product.featured !== false
        );
        setFeaturedProducts(featured);
      } catch (error: unknown) {
        console.error("Error fetching features products:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-500">
        <p className="font-semibold text-xl">Error loading featured products:</p>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  // Duplicate products multiple times for seamless infinite scroll
  const displayedProducts = [
    ...featuredProducts.slice(0, 10),
    ...featuredProducts.slice(0, 10),
    ...featuredProducts.slice(0, 10),
    ...featuredProducts.slice(0, 10),
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-8xl">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-indigo-600">
            {featureTexts.featureproducts}
          </h2>
          {featuredProducts.length > 10 && (
            <button
              onClick={() => router.push("/shop")}
              className="flex items-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {featureTexts.viewAll}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          )}
        </div>
        {featuredProducts.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            {featureTexts.noProductsFound}
          </p>
        ) : (
          <div className="overflow-hidden">
            <motion.div
              className="flex flex-row gap-8"
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                repeat: Infinity,
                duration: 40,
                ease: "linear",
                repeatType: "loop"
              }}
              style={{ display: "inline-flex" }}
            >
              {displayedProducts.map((product, index) => {
                let primaryImage = "/images/default-image.png";
                if (
                  product.images &&
                  product.images.length > 0 &&
                  product.images[0]
                ) {
                  primaryImage = product.images[0];
                } else if (product.image) {
                  primaryImage = product.image;
                }
                return (
                  <div
                    className="w-96 flex-shrink-0 transition-transform duration-300 hover:scale-105"
                    key={`${product.id}-${index}`}
                  >
                    <ProductCard
                      product={{
                        ...product,
                        images: [primaryImage],
                      }}
                      viewMode="grid"
                    />
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}