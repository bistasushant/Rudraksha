"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FAQ_ITEMS } from "@/lib/constants";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
    return (
        <section className="py-16 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-2"
                    >
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-[#F5F5DC]/80 mb-6">
                            Find answers to common questions about Rudraksha beads, their authenticity, spiritual properties, and care.
                        </p>
                        <div className="relative aspect-square max-w-md">
                            <Image
                                src="https://images.pexels.com/photos/7527053/pexels-photo-7527053.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                                alt="Rudraksha beads"
                                fill
                                className="rounded-lg object-cover"
                                priority
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-3"
                    >
                        <Accordion type="single" collapsible className="space-y-4">
                            {FAQ_ITEMS.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="border border-[#B87333]/30 rounded-lg overflow-hidden px-4"
                                >
                                    <AccordionTrigger className="text-[#F5F5DC] hover:text-[#D4AF37] text-left py-4">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-[#F5F5DC]/80 pb-4">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}