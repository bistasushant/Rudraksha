"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { IFaq } from "@/types";
import HTMLContent from "../HTMLContent";


export default function FAQ() {
    const [faqData, setFaqData] = useState<IFaq[] | null>(null);
    const [faqImage, setFaqImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [faqResponse, imageResponse] = await Promise.all([
                    fetch('/api/faq'),
                    fetch('/api/faq/image')
                ]);
                
                const faqData = await faqResponse.json();
                const imageData = await imageResponse.json();
                
                if(!faqData.error && faqData.data?.faqs) {
                    setFaqData(faqData.data.faqs);
                }
                
                if(!imageData.error && imageData.data?.image) {
                    setFaqImage(imageData.data.image);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    },[]);

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
                                src={faqImage || "/images/5muki.png"}
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
                            {faqData?.filter(item => item.type === "faq").map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="border border-[#B87333]/30 rounded-lg overflow-hidden px-4"
                                >
                                    <AccordionTrigger className="text-[#F5F5DC] hover:text-[#D4AF37] text-left py-4">
                                        {item.question}?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-[#F5F5DC]/80 pb-4">
                                    <HTMLContent html={item.answer} />
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