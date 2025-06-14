"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface CategoryDetails {
    id: string;
    name: string;
    image: string;
    href?: string;
    slug?: string; // Added to match API response
    description?: string; // Added to match API response
}

const CATEGORIES: CategoryDetails[] = []; // Fallback empty array

export default function Categories() {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [categoryData, setCategoryData] = useState<CategoryDetails[]>(CATEGORIES);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch("/api/category?page=1&limit=10", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch categories");
                }

                const data = await response.json();
                console.log("API Response:", data);

                if (data.error) {
                    throw new Error(data.message);
                }

                // Extract categories from data.data.categories and ensure it's an array
                const categories = Array.isArray(data.data?.categories) ? data.data.categories : [];
                // Map to ensure href is included
                const formattedCategories = categories.map((cat: CategoryDetails) => ({
                    id: cat.id,
                    name: cat.name,
                    image: cat.image,
                    href: cat.slug ? `/categories/${cat.slug}` : "#", // Generate href from slug
                    slug: cat.slug,
                    description: cat.description,
                }));
                setCategoryData(formattedCategories);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching categories";
                setError(errorMessage);
                setCategoryData(CATEGORIES);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, []);

    const scrollNext = () => {
        if (activeIndex < categoryData.length - 5) {
            setActiveIndex((prev) => prev + 1);
        }
    };

    const scrollPrev = () => {
        if (activeIndex > 0) {
            setActiveIndex((prev) => prev - 1);
        }
    };

    return (
        <section className="py-16 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-between items-end mb-8"
                >
                    <div>
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2">
                            Explore Sacred Categories
                        </h2>
                    </div>
                    <div className="hidden md:flex space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollPrev}
                            disabled={activeIndex === 0}
                            className="border-[#B87333] text-antiqueCopper hover:bg-gray-300 hover:text-[#B87333] disabled:opacity-50"
                        >
                            <ChevronLeft size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollNext}
                            disabled={activeIndex === categoryData.length - 1}
                            className="border-[#B87333] text-antiqueCopper hover:bg-gray-300 hover:text-[#B87333] disabled:opacity-50"
                        >
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </motion.div>
                <p className="text-[#F5F5DC]/80 max-w-2xl mb-6">
                    Discover our curated collection of authentic Rudraksha products, each with unique spiritual properties.
                </p>

                {loading && <p className="text-[#F5F5DC]/80">Loading categories...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && categoryData.length === 0 && (
                    <p className="text-[#F5F5DC]/80">No categories available.</p>
                )}

                <div ref={containerRef} className="overflow-hidden relative">
                    <div 
                        className="flex gap-6 transition-all duration-500 ease-in-out" 
                        style={{ 
                            transform: `translateX(-${activeIndex * (100/5)}%)`,
                            width: `${(categoryData.length * 100) / 5}%`
                        }}
                    >
                        {categoryData.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="w-[calc(100%/5)] flex-shrink-0"
                            >
                                <Link href={category.href || "#"}>
                                    <div className="relative rounded-lg overflow-hidden aspect-[4/5] mb-4 group">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
                                            <div className="p-4 w-full">
                                                <h3 className="text-xl font-medium text-[#F5F5DC]">{category.name}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center mt-8 md:hidden">
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollPrev}
                            disabled={activeIndex === 0}
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50 transition-all duration-300"
                        >
                            <ChevronLeft size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollNext}
                            disabled={activeIndex === categoryData.length - 5}
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50 transition-all duration-300"
                        >
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
