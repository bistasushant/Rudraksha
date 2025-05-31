"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

export default function Banner() {
    return (
        <section className="py-20 relative overflow-hidden">
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url(https://images.pexels.com/photos/6045028/pexels-photo-6045028.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.3
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
                        Experience the Divine Energy of Sacred Rudraksha
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-[#F5F5DC]/90 mb-8"
                    >
                        Transform your spiritual practice with our collection of authentic, energetically powerful Rudraksha beads and jewelry.
                    </motion.p>

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