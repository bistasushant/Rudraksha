"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { useState, useRef } from "react";

export default function Categories() {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollNext = () => {
        setActiveIndex((prev) => Math.min(prev + 1, CATEGORIES.length - 1));
        if (containerRef.current) {
            containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
    };

    const scrollPrev = () => {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        if (containerRef.current) {
            containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
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
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50"
                        >
                            <ChevronLeft size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollNext}
                            disabled={activeIndex === CATEGORIES.length - 1}
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50"
                        >
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </motion.div>
                <p className="text-[#F5F5DC]/80 max-w-2xl mb-6">
                    Discover our curated collection of authentic Rudraksha products, each with unique spiritual properties.
                </p>
                <div
                    ref={containerRef}
                    className="overflow-hidden"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {CATEGORIES.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="w-full"
                            >
                                <Link href={category.href}>
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
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50"
                        >
                            <ChevronLeft size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={scrollNext}
                            disabled={activeIndex === CATEGORIES.length - 1}
                            className="border-[#B87333] text-[#B87333] hover:bg-[#B87333]/20 disabled:opacity-50"
                        >
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}