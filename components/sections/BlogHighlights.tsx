"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
    slug: string;
}

export default function BlogHighlights() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        const fetchBlogPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/blog?limit=3");
                if (!response.ok) {
                    throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
                }
                const data = await response.json();
                if (data.error || !data.data || !Array.isArray(data.data.blogs)) {
                    throw new Error("Received invalid data format from API");
                }
                const posts = data.data.blogs.map((blog: {
                    id: string;
                    heading?: string;
                    description?: string;
                    createdAt: string;
                    image?: string;
                    slug: string;
                }) => ({
                    id: blog.id,
                    title: blog.heading || "Untitled",
                    excerpt: blog.description ? DOMPurify.sanitize(blog.description, { ALLOWED_TAGS: [] }).substring(0, 80) + "..." : "No description available",
                    date: new Date(blog.createdAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                    }),
                    image: blog.image || "/images/rudrakhsa.png",
                    slug: blog.slug
                }));
                setBlogPosts(posts);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
                setError(error instanceof Error ? error.message : "Failed to fetch blog posts");
            } finally {
                setLoading(false);
            }
        };
        fetchBlogPosts();
    }, []);

    return (
        <section className="py-16 bg-[#1C1C1C]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
                >
                    <div>
                        <h2 className="font-cormorant text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
                            Sacred Wisdom & Insights
                        </h2>
                        <p className="text-[#F5F5DC]/80 max-w-2xl">
                            Explore our collection of articles on Rudraksha benefits, spiritual practices, and authentic guidance.
                        </p>
                    </div>
                    <Link href="/blog" className="mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            className="border-[#B87333] text-white hover:text-white bg-[#1C1C1C] hover:bg-[#B87333]/20"
                        >
                            View All Articles
                        </Button>
                    </Link>
                </motion.div>

                {loading ? (
                    <div className="text-center text-[#F5F5DC]">Loading...</div>
                ) : error ? (
                    <div className="text-center text-red-500">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {blogPosts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="group"
                            >
                                <Link href={`/blog/${post.slug}`}>
                                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-4">
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex items-center text-sm text-[#B87333] mb-2">
                                        <CalendarIcon size={14} className="mr-1" />
                                        <span>{post.date}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#F5F5DC] mb-2 group-hover:text-[#D4AF37] transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-[#F5F5DC]/70 mb-4 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center text-[#B87333] font-medium group-hover:text-[#D4AF37] transition-colors">
                                        <span className="mr-2">Read More</span>
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}