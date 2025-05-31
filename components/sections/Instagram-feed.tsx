"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_POSTS } from "@/lib/constants";

export default function InstagramFeed() {
    return (
        <section className="py-16 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                        #RudrakshaVibes
                    </h2>
                    <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                        Follow us on Instagram for inspiration, spiritual wisdom, and a glimpse into the world of Rudraksha.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                    {INSTAGRAM_POSTS.map((post, index) => (
                        <motion.a
                            key={post.id}
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative aspect-square rounded-md overflow-hidden group"
                        >
                            <Image
                                src={post.image}
                                alt={`Instagram post ${post.id}`}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-[#1C1C1C]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Instagram size={24} className="text-[#F5F5DC]" />
                            </div>
                        </motion.a>
                    ))}
                </div>

                <div className="flex justify-center mt-10">
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-[#B87333] bg-[#1C1C1C] text-white hover:bg-[#B87333]/20 hover:text-white flex items-center"
                    >
                        <Instagram size={20} className="mr-2" />
                        Follow Us on Instagram
                    </Button>
                </div>
            </div>
        </section>
    );
}