"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

export default function LimitedTimeDeal() {
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 59,
        seconds: 59
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const newSeconds = prev.seconds - 1;
                if (newSeconds >= 0) {
                    return { ...prev, seconds: newSeconds };
                }

                const newMinutes = prev.minutes - 1;
                if (newMinutes >= 0) {
                    return { ...prev, minutes: newMinutes, seconds: 59 };
                }

                const newHours = prev.hours - 1;
                if (newHours >= 0) {
                    return { hours: newHours, minutes: 59, seconds: 59 };
                }

                // Reset to a full day when it hits zero
                return { hours: 23, minutes: 59, seconds: 59 };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (value: number) => {
        return value.toString().padStart(2, '0');
    };

    return (
        <section className="py-10 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="rounded-lg p-6 md:p-8"
                    style={{ backgroundColor: COLORS.himalayanRed }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                            <h3 className="text-xl md:text-2xl font-bold text-[#F5F5DC] mb-2">
                                15% OFF ALL MALA BEADS
                            </h3>
                            <p className="text-[#F5F5DC]/90">
                                Use code <span className="font-mono font-bold">SACRED15</span> at checkout
                            </p>
                        </div>

                        <div className="flex items-center space-x-4 md:space-x-6">
                            <div className="flex items-center space-x-1 md:space-x-2">
                                <div className="text-center">
                                    <div className="w-10 md:w-14 h-10 md:h-14 bg-[#1C1C1C] rounded flex items-center justify-center">
                                        <span className="text-lg md:text-2xl font-bold text-[#F5F5DC]">
                                            {formatTime(timeLeft.hours)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#F5F5DC]/80">Hours</span>
                                </div>
                                <span className="text-xl md:text-2xl font-bold text-[#F5F5DC]">:</span>
                                <div className="text-center">
                                    <div className="w-10 md:w-14 h-10 md:h-14 bg-[#1C1C1C] rounded flex items-center justify-center">
                                        <span className="text-lg md:text-2xl font-bold text-[#F5F5DC]">
                                            {formatTime(timeLeft.minutes)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#F5F5DC]/80">Minutes</span>
                                </div>
                                <span className="text-xl md:text-2xl font-bold text-[#F5F5DC]">:</span>
                                <div className="text-center">
                                    <div className="w-10 md:w-14 h-10 md:h-14 bg-[#1C1C1C] rounded flex items-center justify-center">
                                        <span className="text-lg md:text-2xl font-bold text-[#F5F5DC]">
                                            {formatTime(timeLeft.seconds)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#F5F5DC]/80">Seconds</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="bg-[#F5F5DC] text-[#8B1A1A] hover:bg-[#F5F5DC]/90"
                            >
                                Shop Now
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}