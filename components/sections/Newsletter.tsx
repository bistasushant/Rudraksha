"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLORS } from "@/lib/constants";

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
        }
    };

    return (
        <section className="py-16 relative overflow-hidden bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto bg-[#2A2A2A] rounded-lg p-6 md:p-10 relative z-10"
                >
                    <div className="text-center mb-6 md:mb-8">
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                            Join Our Spiritual Community
                        </h2>
                        <p className="text-[#F5F5DC]/80">
                            Subscribe to receive 10% off your first order, plus a free Rudraksha care guide.
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    type="email"
                                    placeholder="Your email address"
                                    className="bg-[#1C1C1C] border-[#B87333]/50 text-[#F5F5DC] flex-grow"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    className="whitespace-nowrap"
                                    style={{ backgroundColor: COLORS.antiqueCopper }}
                                >
                                    <Mail size={18} className="mr-2" />
                                    Subscribe
                                </Button>
                            </div>
                            <p className="text-[#F5F5DC]/60 text-sm mt-3 text-center">
                                By subscribing, you agree to our Privacy Policy and consent to receive our newsletter.
                            </p>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center p-6"
                        >
                            <CheckCircle2 size={48} className="text-[#D4AF37] mx-auto mb-4" />
                            <h3 className="text-xl text-[#F5F5DC] font-medium mb-2">Thank You for Subscribing!</h3>
                            <p className="text-[#F5F5DC]/80">
                                Check your inbox for your 10% discount code and free Rudraksha care guide.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Decorative elements */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                whileInView={{ opacity: 0.15, scale: 1, rotate: -10 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="absolute top-[10%] left-[5%] w-32 h-32 rounded-full"
                style={{ backgroundColor: COLORS.brassGold }}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
                whileInView={{ opacity: 0.1, scale: 1, rotate: 15 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute bottom-[15%] right-[8%] w-40 h-40 rounded-full"
                style={{ backgroundColor: COLORS.himalayanRed }}
            />
        </section>
    );
}