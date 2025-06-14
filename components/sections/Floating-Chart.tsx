"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 p-4 bg-[#2A2A2A] rounded-lg shadow-lg w-72"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-[#F5F5DC]">Chat with us</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#F5F5DC]/80 hover:text-[#F5F5DC]"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={16} />
                            </Button>
                        </div>
                        <p className="text-sm text-[#F5F5DC]/80 mb-4">
                            Questions about our products? We&apos;re here to help!
                        </p>
                        <Button
                            className="w-full"
                            style={{ backgroundColor: COLORS.antiqueCopper }}
                        >
                            Start Chat
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg focus:outline-none"
                style={{ backgroundColor: isOpen ? COLORS.himalayanRed : COLORS.antiqueCopper }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <MessageCircle size={24} className="text-white" />
                )}
            </motion.button>
        </div>
    );
}