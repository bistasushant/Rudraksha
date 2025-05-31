"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOP_SELLING } from "@/lib/constants";

export default function TopSelling() {
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
                        Our Most Treasured Pieces
                    </h2>
                    <p className="text-[#F5F5DC]/80 max-w-2xl mx-auto">
                        Discover our best-selling Rudraksha products, each carefully selected for their
                        powerful spiritual properties and exquisite craftsmanship.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {TOP_SELLING.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="group"
                        >
                            <Link href={product.href}>
                                <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                        <div className="p-4 w-full">
                                            <Button
                                                className="w-full bg-[#F5F5DC] text-[#1C1C1C] hover:bg-[#F5F5DC]/90"
                                            >
                                                <ShoppingCart size={16} className="mr-2" />
                                                Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-[#F5F5DC] mb-1">{product.name}</h3>
                                <p className="text-[#B87333] font-medium">${product.price.toFixed(2)}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="flex justify-center mt-10">
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-[#B87333] bg-[#1C1C1C] text-white hover:bg-[#B87333]/20 hover:text-white"
                    >
                        View All Products
                    </Button>
                </div>
            </div>
        </section>
    );
}