"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { IContent } from "@/types";
import HTMLContent from "../HTMLContent";


export default function Banner() {
    const [bannerData, setBannerData] = useState<IContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const fetchBannerData = async () => {
            try {
                const response = await fetch('/api/content/banner');
                const data = await response.json();
                if (!data.error && data.data) {
                    setBannerData(data.data);
                }
            } catch (error) {
                console.error('Error fetching banner data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBannerData();
    }, []);

    if (isLoading) {
        return (
            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-xl animate-pulse">
                        <div className="h-12 bg-gray-200 rounded mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded mb-8"></div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 relative overflow-hidden">
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${bannerData?.image || "https://images.pexels.com/photos/6045028/pexels-photo-6045028.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.9
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1C] via-[#1C1C1C]/80 to-transparent z-0" />
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="font-cormorant text-3xl md:text-5xl font-bold leading-tight text-[#D4AF37] mb-4"
                    >
                        {bannerData?.title || "Experience the Divine Energy of Sacred Rudraksha"}
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-[#F5F5DC]/90 mb-8"
                    >
                    {bannerData?.description ? (
                        <HTMLContent html={bannerData.description} />
                    ) : (
                        "No description available."
                    )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Link href="/shop">
                            <Button
                                size="lg"
                                className="text-[#F5F5DC]"
                                style={{ backgroundColor: COLORS.himalayanRed }}
                            >
                                Shop Now
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}