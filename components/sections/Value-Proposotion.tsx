"use client";

import { motion } from "framer-motion";
import { Leaf, Shield, Truck, Award } from "lucide-react";
import { COLORS } from "@/lib/constants";

const features = [
    {
        title: "100% Authentic",
        description: "Certified genuine Rudraksha with laboratory testing",
        icon: Award,
    },
    {
        title: "Sacred Source",
        description: "Ethically harvested from Himalayan foothills",
        icon: Leaf,
    },
    {
        title: "Protective Energy",
        description: "Ancient spiritual power for modern wellbeing",
        icon: Shield,
    },
    {
        title: "Worldwide Shipping",
        description: "Fast delivery to over 90 countries",
        icon: Truck,
    },
];

export default function ValueProposition() {
    return (
        <section className="py-16 bg-deepGraphite">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-brassGold mb-4">
                        The Rudraksha Difference
                    </h2>
                    <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                        For centuries, Rudraksha beads have been revered for their spiritual significance and healing properties.
                        We bridge ancient wisdom with modern elegance, bringing these sacred treasures to spiritual seekers worldwide.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="flex flex-col items-center text-center p-6 rounded-lg"
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: COLORS.antiqueCopper }}
                            >
                                <feature.icon size={28} className="text-ivoryWhite" />
                            </div>
                            <h3 className="text-xl font-semibold text-ivoryWhite mb-2">{feature.title}</h3>
                            <p className="text-[#F5F5DC]/70">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}