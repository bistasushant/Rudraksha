"use client";

import { motion } from "framer-motion";
import { CERTIFICATIONS, COLORS } from "@/lib/constants";
import { CheckSquare, ShieldCheck, RefreshCw, Leaf } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    CheckSquare,
    ShieldCheck,
    RefreshCw,
    Leaf
};

export default function Certifications() {
    return (
        <section className="py-10 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-8 md:gap-16"
                >
                    {CERTIFICATIONS.map((cert, index) => {
                        const Icon = iconMap[cert.icon];

                        return (
                            <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="flex flex-col items-center"
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                                    style={{ backgroundColor: COLORS.brassGold }}
                                >
                                    {Icon && <Icon size={24} className="text-[#1C1C1C]" />}
                                </div>
                                <span className="text-center text-[#F5F5DC] font-medium">{cert.name}</span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}