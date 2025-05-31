"use client";

import { motion } from "framer-motion";
import { TIMELINE_EVENTS, COLORS } from "@/lib/constants";

export default function Timeline() {
    return (
        <section className="py-16 bg-[#2A2A2A]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                        Our Sacred Journey
                    </h2>
                    <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                        From humble beginnings to a global spiritual brand, trace the path of our dedication to authentic Rudraksha.
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#B87333]/50 transform md:translate-x-[-0.5px]" />

                    <div className="space-y-12">
                        {TIMELINE_EVENTS.map((event, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                                    }`}
                            >
                                <div className="flex-1 md:w-1/2" />

                                {/* Center dot */}
                                <div className="absolute left-4 md:left-1/2 top-0 transform translate-y-1.5 md:translate-x-[-50%]">
                                    <div className="w-8 h-8 rounded-full border-2 border-[#B87333] bg-[#1C1C1C] flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.antiqueCopper }} />
                                    </div>
                                </div>

                                <div className="pl-12 md:pl-0 flex-1 md:w-1/2">
                                    <div className={`p-4 md:p-6 rounded-lg ${index % 2 === 0 ? "md:ml-6" : "md:mr-6"
                                        }`} style={{ backgroundColor: index % 2 === 0 ? "#1C1C1C" : "#262626" }}>
                                        <div className="text-[#D4AF37] font-bold text-xl mb-2">{event.year}</div>
                                        <h3 className="text-[#F5F5DC] font-semibold text-lg mb-2">{event.title}</h3>
                                        <p className="text-[#F5F5DC]/70">{event.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}