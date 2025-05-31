"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Leaf, Recycle, Heart } from "lucide-react";
import { COLORS } from "@/lib/constants";

export default function EcoResponsibility() {
    return (
        <section className="py-16 bg-[#2A2A2A] relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
                            <Image
                                src="/images/5muki.png"
                                alt="Eco-friendly practices"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/70 to-transparent" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                            Our Sacred Commitment
                        </h2>
                        <p className="text-[#F5F5DC]/80 mb-6">
                            Rudraksha is more than a brand – it&apos;s a mission to preserve ancient traditions while protecting
                            the environment and supporting the communities that make our work possible.
                        </p>

                        <div className="space-y-6">
                            <div className="flex">
                                <div
                                    className="h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                                    style={{ backgroundColor: COLORS.antiqueCopper }}
                                >
                                    <Leaf size={20} className="text-[#F5F5DC]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-[#F5F5DC] mb-1">Sustainable Sourcing</h3>
                                    <p className="text-[#F5F5DC]/70">
                                        We work directly with local communities in Nepal and India to ensure ethical harvesting
                                        practices that preserve Rudraksha trees for future generations.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div
                                    className="h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                                    style={{ backgroundColor: COLORS.antiqueCopper }}
                                >
                                    <Recycle size={20} className="text-[#F5F5DC]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-[#F5F5DC] mb-1">Eco-Friendly Packaging</h3>
                                    <p className="text-[#F5F5DC]/70">
                                        All our products come in plastic-free, biodegradable packaging made from recycled materials,
                                        minimizing our environmental footprint.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div
                                    className="h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                                    style={{ backgroundColor: COLORS.antiqueCopper }}
                                >
                                    <Heart size={20} className="text-[#F5F5DC]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-[#F5F5DC] mb-1">Temple Restoration</h3>
                                    <p className="text-[#F5F5DC]/70">
                                        A portion of every purchase goes toward restoring ancient temples and supporting the
                                        artisans who create our handcrafted pieces.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}